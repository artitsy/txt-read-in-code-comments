import fse = require('fs-extra');
import * as vscode from 'vscode';
import * as chardet from 'chardet';
import * as iconv from 'iconv-lite';

var cacheFolder: string;    // 缓存文件 根目录
var cacheFile: string;      // 缓存文件 路径  cacheFolder + "cacheFile"
var readingFile: number;    // 缓存文件 句柄
var position: number;       // 读到位置
var text: string;           // 在读文本
var hide: boolean;          // 老板键 隐藏状态

//*//   配置管理  todo: 配置修改
class Configr {
    
    context: vscode.ExtensionContext;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }
    
    
    GetEditor(): vscode.TextEditor {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            //vscode.window.showErrorMessage('不在活动的编辑器中');
            throw new Error('不在活动的编辑器中');
        }
        return editor;
    }
    
    GetLang(): string {
        return this.GetEditor().document.languageId;
    }
    
    GetWordsLimit(): number {
        return this.context.globalState.get("WordsLimit");
    }
    
    GetSign(): string { 
        let sign:string = this.context.globalState.get("Sign-" + this.GetLang());
        if (!sign) {
            sign = this.context.globalState.get("Sign-default");
        }
        return sign;
    }
    
    GetPosition(): number {
        return this.context.globalState.get("position");
    }
    
    GetConfigVersionTag(): number {
        return this.context.globalState.get("ConfigVersionTag", 0);
    }
    
    GettotalLine(): number {
        return this.context.globalState.get("totalLine");
    }
    
    SetWordsLimit(limit: number): void {
        this.context.globalState.update("WordsLimit", limit);
    }
    
    SetSign(lang: string, sign: string): void {
        this.context.globalState.update("Sign-" + lang, sign);
    }
    
    SetPosition(position: number): void {
        this.context.globalState.update("position", position);
    }
    
    SetConfigVersionTag(tag: number): void {
        this.context.globalState.update("ConfigVersionTag", tag);
    }
    
    SettotalLine(totalLine: number): void {
        this.context.globalState.update("totalLine", totalLine);
    }
};
//*//   
var configr: Configr;

//*//   文本处理

// 检查一个字符是否为标点符号
function isPunctuation(char: string): boolean {
    return /[，。！？；：”’】》）、,.!?;:'"\]\)>\}]/.test(char);
}

// 格式化文本
function formatText(OriginalText: string, WordsLimit: number): string {
    let lines: string[] = 
        ("\n" + OriginalText.replaceAll("\r", "\n") + "\n")
        .replace(/\n\n+/g, "\n")
        .slice(1, -1)
        .split("\n");
    
    let text: string = "";
    
    for (const line of lines) {
        let i = 0;
        for (; i + WordsLimit < line.length; i += WordsLimit) {
            let sentence = line.slice(i, i + WordsLimit + 1);
            if (!isPunctuation(sentence.slice(-1))) {
                sentence = sentence.slice(0, -1) + '\u{F8888}';
            } else {
                ++ i;
            }
            text += sentence;
        }
        if (i < line.length) {
            text += line.slice(i) + '\u{F8888}'.repeat(i + WordsLimit + 1 - line.length);
        }
    }
    return text;
}
//*//   

//*//   主要功能函数
function WorkInit(): void {
    vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: false,
        filters: {
            'Text': ['txt', 'in', 'out', 'ans'],
            'Code': ['c', 'cpp', 'py', 'java', 'go', 'cs', 'rs', 'php', 'html', 'css', 'js', 'json', 'xml', 'sh', 'bat', 'lua', 'sql', 'md', 'conf', 'log', 'gitignore', 'gitattributes'],
            'All': ['*']
        },
        openLabel: '选择'
    }).then((uri: vscode.Uri[] | undefined) => {
        if (uri && uri[0]) {
            const frmfile: string = uri[0].fsPath;
            
            let buffer: Buffer = fse.readFileSync(frmfile);
            
            // 测试是否为二进制文件  todo: UTF-16
            const bytesToCheck = Math.min(buffer.length, 1024);
            for (let i = 0; i < bytesToCheck; ++ i) {
                if (buffer[i] === 0) {
                    vscode.window.showErrorMessage('二进制文件不支持！');
                    return;
                }
            }
            
            let encoding: string = chardet.detect(buffer) || 'utf8';
            
            let text: string;
            if (encoding.toLowerCase() !== 'utf-8') {
                text = iconv.decode(buffer, encoding);
            } else {
                text = buffer.toString('utf8');
            }
            
            
            let wordslimit = configr.GetWordsLimit();
            
            text = formatText(text, wordslimit);
            
            Buffer.from(text, 'binary')
            fse.writeFileSync(cacheFile, iconv.encode(text, 'utf32le'));
            
            // 初始化指针为0
            //configr.SetPosition(0);
            configr.SettotalLine(text.length / (wordslimit + 1));
            
            readingFile = fse.openSync(cacheFile, 'r');
            
            vscode.window.showInformationMessage('读取执行完毕');
        }
    });
}

// 从缓存读取所需内容
function Read(): string {
    let wordslimit: number = configr.GetWordsLimit();
    
    // 检查文件是否读取完/读到头
    if (position < 1) {
        position = 0;
        vscode.window.showInformationMessage(`到头了呢。`);
        return "-- BEGIN --";
    }
    if (position > configr.GettotalLine()) {
        position = configr.GettotalLine() + 1;
        vscode.window.showInformationMessage(`读完了呢。`);
        return "-- END --";
    }
    //const stats: fse.Stats = fse.statSync(cacheFile);
    
    let buffer = Buffer.alloc(wordslimit * 4, 0);
    fse.readSync(readingFile, buffer, 0, wordslimit * 4, (position - 1) * wordslimit * 4);
    
    let readText: string = iconv.decode(buffer, 'utf32le');
    
    return readText;
}

// 向工作区写入
function Write(text: string = Read()) {
    let sign: string = configr.GetSign();
    let editor: vscode.TextEditor = configr.GetEditor();
    // 如果不存在标志符
    if (editor.document.getText().indexOf(sign) === -1) {
        editor.edit(editBuilder => {
            const begin = new vscode.Position(editor.selection.active.line, 0);
            editBuilder.insert(begin, sign + "\n");
        }).then(() => {
            Write(text);
        });
        return;
    }
    
    for (let lineNumber = 0; lineNumber < editor.document.lineCount; ++ lineNumber) {
        
        // 寻找标记位置
        let textOfThisLine: vscode.TextLine = editor.document.lineAt(lineNumber);
        let indexPosition: number = textOfThisLine.text.indexOf(sign);
        
        // 替换文本
        if (indexPosition !== -1) {
            indexPosition += sign.length;
            editor.edit(editBuilder => {
                let range: vscode.Range = new vscode.Range(lineNumber, indexPosition, lineNumber, textOfThisLine.text.length);
                editBuilder.replace(range, text);
            });
            break;
        }
    }
}

// 显示下一句
async function WorkNext(): Promise<void> {
    ++ position;
    Write();
}

//显示上一句
async function WorkLast(): Promise<void> {
    -- position;
    Write();
}

function WorkTurn(): void {
    let totalLine: number = configr.GettotalLine();
    vscode.window.showInputBox({
        prompt: '请输入跳转页数（当前第 ' + position.toString() + ' 页，共 ' + totalLine.toString() + ' 页）',
        placeHolder: '1~' + totalLine.toString(),
        validateInput: (res: string) => {
            if (isNaN(Number(res))) {
                return '输入不是数字'
            }
            let page = Number(res);
            if (page < 1 || page > totalLine) {
                return '范围不合法'
            }
            return null;
        },
    }).then((turnPage) => {
        // console.log(turnPage);
        if (isNaN(Number(turnPage))) {
            vscode.window.showInformationMessage('取消跳转');
            return;
        }
        position = Number(turnPage);
        Write();
    });
}

function WorkHide(): void {
    if (hide === false) {
        hide = true;
        Write("");
    } else {
        hide = false;
        Write(text);
    }
}

let TryCatchFinally: (func: () => void) => () => void = (func: () => void) => () => {
    if (func !== WorkHide) {
        hide = false;
    }
    position = configr.GetPosition();
    try {
        func();
    } catch (err) { // todo
        if (err instanceof Error) {
            vscode.window.showErrorMessage(err.message);
        } else {
            vscode.window.showErrorMessage('未知错误');
        }
    } finally {
        configr.SetPosition(position);
    }
};
//*//   

//*//   配置更新
function CheckConfigVersion() {
    let ConfigVersionTag: number = configr.GetConfigVersionTag();
    if (ConfigVersionTag < 2) {
        try {
            fse.accessSync(cacheFolder + "txtfile1", fse.constants.F_OK | fse.constants.W_OK);
        } catch {
            ConfigVersionTag = 0;
            WorkInit();
        }
        if (ConfigVersionTag === 1) {
            let text1 = fse.readFileSync(cacheFolder + "txtfile1", 'utf8') + fse.readFileSync(cacheFolder + "txtfile2", 'utf8');
            let text2 = fse.readFileSync(cacheFolder + "txtfile3", 'utf8');
            
            let text: string = text1 + text2;
            
            Buffer.from(text, 'binary')
            fse.writeFileSync(cacheFile, iconv.encode(text, 'utf32le'));
            
            position = text1.length;
            configr.SetPosition(position);
            readingFile = fse.openSync(cacheFile, 'r');
            
            vscode.window.showInformationMessage('配置版本更新完成: 1 -> 2');
        }
        configr.SetConfigVersionTag(2);
    }
}
//*//

//function CheckCache(): void {       todo: 等throw error了再处理
    //try {
    //    fse.accessSync(cacheFile, fse.constants.F_OK | fse.constants.W_OK);
    //} catch (err) {
    //    if (err) {
    //        WorkInit();
    //    }
    //    return;
    //}
//}

//*//   入口函数
function activate(context: vscode.ExtensionContext): void {
    // 极端错误处理
    if (EXTREME_ERROR) {
        vscode.window.showErrorMessage('程序遭遇极端错误，请联系开发者，如需重新启动，请禁用并重新启用本插件');
        return;
    }
    
    // 全局变量初始化
    cacheFolder = context.globalStorageUri.fsPath + '/';
    cacheFile = cacheFolder + "cacheFile";
    readingFile = fse.openSync(cacheFile, 'r');
    hide = false;
    configr = new Configr(context);
    text = "";
    
    // 注册命令
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.init', TryCatchFinally(WorkInit)));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.next', TryCatchFinally(WorkNext)));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.last', TryCatchFinally(WorkLast)));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.hide', TryCatchFinally(WorkHide)));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.turn', TryCatchFinally(WorkTurn)));
    
    CheckConfigVersion();
}
//*//

//*// 错误集中处理
type ErrorType = number;                    // todo: 长得不太好看，要不用枚举类型
const ERROR_UNKOWN: ErrorType = -1;
const ERROR_SIGN_SETTING: ErrorType = 2;
const ERROR_FILE_NOT_FOUND: ErrorType = 3;
const ERROR_WORDSLIMIT: ErrorType = 4;
const ERROR_IMPOSSIBLE: ErrorType = 114514;
function ThrowError(err: ErrorType): void {
    switch (err) {
        case ERROR_UNKOWN:
            vscode.window.showErrorMessage(`未知错误(ﾟДﾟ*)ﾉ，请联系开发者`);
            ExtremeErrorExitAndDeactive(err);
            break;
        case ERROR_SIGN_SETTING:
            vscode.window.showErrorMessage(`请检查标志符设定╰（‵□′）╯`);
            ErrorExit(err);
            break;
        case ERROR_WORDSLIMIT:
            vscode.window.showErrorMessage(`请检查每行最大字数设定（￣︶￣）↗`);
            ErrorExit(err);
            break;
        case ERROR_IMPOSSIBLE:
            vscode.window.showErrorMessage(`不可能的错误(╯‵□′)╯︵┻━┻，你这代码有问题啊，快去嘲笑开发者。`);
            ExtremeErrorExitAndDeactive(err);
            break;
        default:
            vscode.window.showErrorMessage(`未正确处理的错误😂，请联系开发者。`);
            ExtremeErrorExitAndDeactive(err);
            break;
    }
    ThrowError(ERROR_IMPOSSIBLE);
}

// 因错误强制退出
function ErrorExit(err: ErrorType): never {
    throw new Error(`Error: ${err}`);
}
// 极端错误强制退出并不再被激活
var EXTREME_ERROR: boolean = false;
function ExtremeErrorExitAndDeactive(err: ErrorType): never {
    EXTREME_ERROR = true
    deactivate();
    throw new Error(`Error: ${err}`);
}
//*//

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
}