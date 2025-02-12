import fse = require('fs-extra');
import * as vscode from 'vscode';
import * as chardet from 'chardet';
import * as iconv from 'iconv-lite';
//const fs = require('fs');
//const vscode = require('vscode');
//const chardet = require('chardet');

var cacheFolder: string; // 缓存根目录
var cacheFile: string; // 缓存
var position: number;
var readingFile: number; // 句柄
var totalLine: number; // 总行数


function activate(context: vscode.ExtensionContext): void {
    // 极端错误处理
    if (EXTREME_ERROR) {
        vscode.window.showErrorMessage('程序遭遇极端错误，请联系开发者，如需重新启动，请禁用并重新启用本插件');
        return;
    }
    
    // 设置缓存文件
    cacheFolder = context.globalStorageUri.fsPath + '/'; // 缓存根目录
    cacheFile = cacheFolder + "cacheFile"; // 缓存
    
    hide = false;
    
    class Configr {
        
        GetEditor(): vscode.TextEditor {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('不在活动的编辑器中');
                throw new Error('不在活动的编辑器中');
            }
            return editor;
        }
        
        GetLang(): string {
            return this.GetEditor().document.languageId;
        }
        
        GetWordsLimit(): number {
            return context.globalState.get("WordsLimit");
        }
        
        GetSign(): string { 
            let sign:string = context.globalState.get("Sign-" + this.GetLang());
            if (!sign) {
                sign = context.globalState.get("Sign-default");
            }
            return sign;
        }
        
        GetPosition(): number {
            return context.globalState.get("position");
        }
        
        GetConfigVersionTag(): number {
            return context.globalState.get("ConfigVersionTag");
        }
        
        GettotalLine(): number {
            return context.globalState.get("totalLine");
        }
        
        SetWordsLimit(limit: number): void {
            context.globalState.update("WordsLimit", limit);
        }
        
        SetSign(lang: string, sign: string): void {
            context.globalState.update("Sign-" + lang, sign);
        }
        
        SetPosition(position: number): void {
            context.globalState.update("position", position);
        }
        
        SetConfigVersionTag(tag: number): void {
            context.globalState.update("ConfigVersionTag", tag);
        }
        
        SettotalLine(totalLine: number): void {
            context.globalState.update("totalLine", totalLine);
        }
    };
    let configr: Configr;
    
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
                
                // 测试是否为二进制文件
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
                
                text = "\n" + text.replaceAll("\r", "\n") + "\n";
                text = text.replace(/\n\n+/g, "\n");
                text = text.substring(1);
                
                let wordslimit = configr.GetWordsLimit();
                let tokens: string[] = text.split('\n');
                let pt = 0;
                
                text = '';
                for (const token of tokens) {
                    for (let i = 0; i < token.length; i += wordslimit) {
                        let singlePage = token.slice(i, i + wordslimit);
                        let l = singlePage.length;
                        for (let i = l; i < wordslimit; ++ i) {
                            singlePage += ' ';
                        }
                        text += singlePage;
                        ++ pt;
                    }
                    text += token;
                    pt += Math.ceil(token.length / wordslimit);
                }
                
                Buffer.from(text, 'binary')
                fse.writeFileSync(cacheFile, iconv.encode(text, 'utf32le'));
                
                // 初始化指针为0
                configr.SetPosition(0);
                configr.SettotalLine(pt);
                
                readingFile = fse.openSync(cacheFile, 'r');
                
                vscode.window.showInformationMessage('读取执行完毕');
            }
        });
    }
    
    var text: string = "";
    // 从缓存读取所需内容
    function Read(): string {
        if (readingFile === undefined) {
            readingFile = fse.openSync(cacheFile, 'r');
        }
        
        position = configr.GetPosition();
        let wordslimit: number = configr.GetWordsLimit();
        
        // 检查文件是否读取完/读到头
        if (position <= 0) {
            position = 0;
            vscode.window.showInformationMessage(`到头了呢。`);
            return "-- BEGIN --";
        }
        if (position > totalLine) {
            position = totalLine + 1;
            vscode.window.showInformationMessage(`读完了呢。`);
            return "-- END --";
        }
        const stats: fse.Stats = fse.statSync(cacheFile);
        
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
        
        for (let lineNumber = 0; lineNumber < editor.document.lineCount; ++lineNumber) {
            
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
        position++;
        Write();
    }
    
    //显示上一句
    async function WorkLast(): Promise<void> {
        position--;
        Write();
    }
    
    function WorkTurn(): void {
        vscode.window.showInputBox(
            {
                prompt: '请输入跳转页数（当前第 ' + position.toString() + ' 页，共 ' + totalLine.toString() + ' 页）',
                placeHolder: '1~' + totalLine.toString(),
                validateInput: (res) => {
                    if (isNaN(Number(res))) {
                        return '输入不是数字'
                    }
                    let page = Number(res);
                    if (page < 1 || page > totalLine) {
                        return '范围不合法'
                    }
                    return null;
                },
            }
        ).then((turnPage) => {
            // console.log(turnPage);
            if (isNaN(Number(turnPage))) {
                vscode.window.showInformationMessage('取消跳转');
                return;
            }
            position = Number(turnPage);
            Write();
        });
    }
    
    // 老板键
    var hide: boolean = false
    function WorkHide(): void {
        if (hide === false) {
            Write("");
            hide = true;
        } else {
            hide = false;
            Write(text);
        }
    }
    
    class TryCatchFinally {
        private func: Function;
        
        constructor(func: Function) {
            console.log("TryCatchFinally constructed");
            
            this.func = func;
        }
        
        run() {
            if (this.func !== WorkHide) {
                hide = false;
            }
            CheckCache();
            try {
                this.func();
            } catch (err) {
                if (err instanceof Error) {
                    vscode.window.showErrorMessage(err.message);
                } else {
                    vscode.window.showErrorMessage('未知错误');
                }
            } finally {
                configr.SetPosition(position);
            }
        }
    }
    
    // 注册命令
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.init', new TryCatchFinally(WorkInit).run));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.next', new TryCatchFinally(WorkNext).run));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.last', new TryCatchFinally(WorkLast).run));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.hide', new TryCatchFinally(WorkHide).run));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.turn', new TryCatchFinally(WorkTurn).run));
    
    function CheckCache(): void {
        try {
            fse.accessSync(cacheFile, fse.constants.F_OK | fse.constants.W_OK);
        } catch (err) {
            if (err) {
                WorkInit();
            }
            return;
        }
        if (position === undefined)
            WorkInit();
        
    }
    
    // 检查配置版本
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

// 错误集中处理
type ErrorType = number;
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

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
}