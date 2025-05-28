import * as fse from "fs-extra";
import * as vscode from 'vscode';
import {Configr} from './configr';
import * as mtb from './minitoolbox';

let cacheFolder: string;    // 缓存文件 根目录
let cacheFile: string;      // 缓存文件 路径  cacheFolder + "cacheFile"
let sourceFile: string;     // 源文件   路径
let readingFile: number;    // 缓存文件 句柄
let statusBarItem: vscode.StatusBarItem; // 状态栏项
//let position: number;       // 读到位置     这玩意限定用 configr 转递
//let text: string;           // 在读文本        已弃用，老板键仅用于隐藏
//let hide: boolean;          // 老板键 隐藏状态  已弃用，老板键仅用于隐藏

let configr: Configr;       // 配置管理

function Build(buffer: Buffer, encoding: string, wordsLimit: number) {
    let book: string = mtb.decode(buffer, encoding);
    book = mtb.formatText(book, wordsLimit);
    fse.writeFileSync(cacheFile, mtb.encode(book));
    configr.SetTotalLine(mtb.StrLength(book) / (wordsLimit + 1));
    readingFile = fse.openSync(cacheFile, 'r');
}

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
            const buffer: Buffer = fse.readFileSync(frmfile);
            
            if (mtb.isBinaryFile(buffer)) {
                vscode.window.showErrorMessage('二进制文件不支持！').then();
                return;
            }
            fse.copyFile(frmfile, sourceFile);
            Build(buffer, mtb.detect(buffer), configr.GetWordsLimit());
            configr.SetPosition(0);
            vscode.window.showInformationMessage('读取执行完毕').then();
        }
    });
}

// 从缓存读取所需内容
function Read(): string {
    const wordsLimit: number = configr.GetWordsLimit() + 1;
    const position: number = configr.GetPosition();
    // 检查文件是否读取完/读到头
    if (position < 1) {
        if (position < 0) {
            configr.SetPosition(0);
        }
        vscode.window.showInformationMessage(`到头了呢。总 ${configr.GetTotalLine()} 页。`).then();
        return "-- BEGIN --";
    }
    if (position > configr.GetTotalLine()) {
        if (position > configr.GetTotalLine() + 1) {
            configr.SetPosition(configr.GetTotalLine() + 1);
        }
        vscode.window.showInformationMessage(`读完了呢。总 ${configr.GetTotalLine()} 页。`).then();
        return "-- END --";
    }
    //const stats: fse.Stats = fse.statSync(cacheFile);
    
    const buffer = Buffer.alloc(wordsLimit * 4, 0);
    fse.readSync(readingFile, buffer, 0, wordsLimit * 4, (position - 1) * wordsLimit * 4);
    
    const readText: string = mtb.decode(buffer).replaceAll('\uF888', '');
    
    return readText;
}

// 向工作区写入
function Write(text: string | undefined = undefined): void {
    switch (configr.GetDisplayPlace()) {
        case 0: {
            const editor: vscode.TextEditor = mtb.GetEditor();
            const sign: string = configr.GetSign(editor.document.languageId);
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
            
            if (text === undefined) {
                text = Read();
            }
            
            for (let lineNumber = 0; lineNumber < editor.document.lineCount; ++ lineNumber) {
                
                // 寻找标记位置
                const textOfThisLine: vscode.TextLine = editor.document.lineAt(lineNumber);
                let indexPosition: number = textOfThisLine.text.indexOf(sign);
                
                // 替换文本
                if (indexPosition !== -1) {
                    indexPosition += sign.length;
                    editor.edit(editBuilder => {
                        const range: vscode.Range = new vscode.Range(lineNumber, indexPosition, lineNumber, textOfThisLine.text.length);
                        editBuilder.replace(range, text);
                    }).then();
                    break;
                }
            }
            break;
        }
        case 1: {
            if (text === undefined) {
                text = Read();
            }
            
            statusBarItem.text = text;
            statusBarItem.show();
            break;
        }
    }
    
}

// 显示下一句
function WorkNext(): void {
    configr.SetPosition(configr.GetPosition() + 1);
    Write();
}

//显示上一句
function WorkLast(): void {
    configr.SetPosition(configr.GetPosition() - 1);
    Write();
}

function WorkTurn(): void {
    const totalLine: number = configr.GetTotalLine();
    vscode.window.showInputBox({
        prompt: `请输入跳转页数（当前第 ${configr.GetPosition().toString()} 页，共 ${totalLine.toString()} 页）`,
        placeHolder: '1~' + totalLine.toString(),
        validateInput: (res: string) => {
            if (isNaN(Number(res))) {
                return '输入不是数字'
            }
            const page = Number(res);
            if (page !== Math.floor(page)) {
                return '输入不是整数'
            }
            if (page < 1 || page > totalLine) {
                return '范围不合法'
            }
            return null;
        },
    }).then((turnPage) => {
        // console.log(turnPage);
        if (turnPage) {
            configr.SetPosition(Number(turnPage) - 1);
            WorkNext();
        } else {
            vscode.window.showInformationMessage('取消跳转').then();
        }
    });
}

function WorkHide(): void {
    switch (configr.GetDisplayPlace()) {
        case 0: {
            const editor: vscode.TextEditor = mtb.GetEditor();
            const sign: string = configr.GetSign(editor.document.languageId);
            // 如果不存在标志符就不管
            if (editor.document.getText().indexOf(sign) === -1) {
                return;
            }
            
            for (let lineNumber = 0; lineNumber < editor.document.lineCount; ++ lineNumber) {
                
                // 寻找标记位置
                const textOfThisLine: vscode.TextLine = editor.document.lineAt(lineNumber);
                let indexPosition: number = textOfThisLine.text.indexOf(sign);
                
                // 替换文本
                if (indexPosition !== -1) {
                    indexPosition += sign.length;
                    editor.edit(editBuilder => {
                        const range: vscode.Range = new vscode.Range(lineNumber, indexPosition, lineNumber, textOfThisLine.text.length);
                        editBuilder.replace(range, "");
                    }).then();
                    break;
                }
            }
            break;
        }
        case 1: {
            statusBarItem.hide();
            break;
        }
    }
}

function WorkSet() {
    vscode.window.showQuickPick([
        "WordsLimit",
        "Sign",
        "DisplayPlace",
    ]).then(value => {
        if (value) {
            switch (value) {
                case "WordsLimit":
                    vscode.window.showInputBox({
                        prompt: `当前 ${value} 的值为 ${configr.GetWordsLimit()}，请输入新的值`,
                        validateInput: (res: string) => {
                            const val = Number(res);
                            if (isNaN(val)) {
                                return '输入不是数字'
                            }
                            if (val !== Math.floor(val)) {
                                return '输入不是整数'
                            }
                            if (val < 1) {
                                return '不能小于 1'
                            }
                            return null;
                        },
                    }).then((res) => {
                        if (res) {
                            const LastWordsLimit: number = configr.GetWordsLimit();
                            let NowWordsLimit: number = Number(res);
                            
                            // 已经读了多少个不为\uF888的字符
                            let count: number = configr.GetPosition() * (LastWordsLimit + 1);
                            let buffer = Buffer.alloc(count * 4, 0);
                            fse.readSync(readingFile, buffer, 0, count * 4, 0);
                            count = mtb.decode(buffer).replaceAll('\uF888', '').length;
                            
                            configr.SetWordsLimit(NowWordsLimit);
                            buffer = fse.readFileSync(sourceFile);
                            Build(buffer, mtb.detect(buffer), NowWordsLimit);
                            
                            let position: number = 0;
                            ++ NowWordsLimit;
                            buffer = Buffer.alloc(NowWordsLimit * 4, 0);
                            while (count >= 0) {
                                fse.readSync(readingFile, buffer, 0, NowWordsLimit * 4, position * NowWordsLimit * 4);
                                count -= mtb.decode(buffer).replaceAll('\uF888', '').length;
                                ++ position;
                            }
                            configr.SetPosition(position - 1);
                            
                            vscode.window.showInformationMessage(`WordsLimit 已从 ${LastWordsLimit} 更改为 ${NowWordsLimit - 1}`).then();
                        }
                    });
                    break;
                case "Sign":
                    //console.log(vscode.languages.getLanguages());
                    vscode.languages.getLanguages().then((languages) => {
                        
                        languages.sort();
                        languages.unshift('default');
                        
                        const quickpick = vscode.window.createQuickPick();
                        
                        quickpick.items = languages
                            .map(lang => {
                                const sign = configr.GetSign(lang);
                                
                                return {
                                    label: lang,
                                    detail: `(${sign})`,
                                    //iconClasses: ['file-icon', `${lang}-lang-file-icon`]
                                };
                            });
                        quickpick.show();
                        quickpick.onDidChangeSelection(selection => {
                            if (selection.length > 0) {
                                const selected = selection[0];
                                const lang = selected.label;
                                const sign = configr.GetSign(lang);
                                
                                vscode.window.showInputBox({
                                    prompt: `当前 ${lang} 的标志符为 (${sign})，请输入新的标志符`,
                                    value: sign,
                                    validateInput: (res: string) => {
                                        if (res.length === 0) {
                                            return '输入不能为空'
                                        }
                                        return null;
                                    },
                                }).then((res) => {
                                    if (res) {
                                        configr.SetSign(lang, res);
                                        vscode.window.showInformationMessage(`${lang} 的标志符已更改为 (${res})`).then();
                                    }
                                });
                            }
                        });
                    });
                    
                    
                    break;
                case "DisplayPlace":
                    let DPName: string [] = ["行内注释", "状态栏", "行间注释"];
                    DPName[configr.GetDisplayPlace()] += " (当前)";
                    vscode.window.showQuickPick([
                        DPName[0],
                        DPName[1],
                        //DPName[2],
                    ]).then(value => {
                        if (value) {
                            WorkHide();
                            switch (value) {
                                case DPName[0]:
                                    configr.SetDisplayPlace(0);
                                    break;
                                case DPName[1]:
                                    configr.SetDisplayPlace(1);
                                    break;
                                //case DPName[2]:
                                //    configr.SetDisplayPlace(2);
                                //    break;
                            }
                            vscode.window.showInformationMessage(`显示位置已更改为 ${value}`).then();
                        }
                    });
                    break;
            }
        }
    });
} 

// 搜索结果类型定义
interface SearchResult {
    pageNumber: number;    // 页码
    pageContent: string;   // 页面内容
    startIndex: number;    // 匹配开始位置
    endIndex: number;      // 匹配结束位置
    beforeContext?: string; // 匹配前的上下文
    afterContext?: string;  // 匹配后的上下文
}

// 全文搜索函数
function WorkSearch(): void {
    vscode.window.showInputBox({
        prompt: '请输入要搜索的内容',
        placeHolder: '搜索关键词',
        validateInput: (text: string) => {
            if (!text || text.trim().length === 0) {
                return '搜索内容不能为空';
            }
            return null;
        }
    }).then((searchText) => {
        if (searchText) {
            // 执行搜索
            
            const results: SearchResult[] = [];
            
            // 读取源文件
            const buffer = fse.readFileSync(cacheFile);
            
            const content = mtb.decode(buffer);
            const wordsLimit = configr.GetWordsLimit();
            
            const Pattern = searchText
                .slice(0, -1)
                .split('')
                .map(ch => `${ch}(\\uF888*)`);
            Pattern.push(searchText.slice(-1));
            const pattern = Pattern.join('');
            
            var searchpatt = new RegExp(pattern, 'g');
            
            
            let matchCount = 0;
            let match: RegExpExecArray | null;
            while ((match = searchpatt.exec(content)) !== null) {
                // 多余 24 项匹配，就不显示了
                ++ matchCount;
                if (matchCount > 24) {
                    vscode.window.showWarningMessage(`匹配项多于 24 个，请使用更详细的检索词。`).then();
                    return;
                }
                
                const pageNumber = Math.floor(match.index / (wordsLimit + 1));
                const pageContent = content.slice(pageNumber * (wordsLimit + 1), (pageNumber + 1) * (wordsLimit + 1));

                const startIndex = match.index % (wordsLimit + 1);
                const endIndex = startIndex + match[0].length - 1;
                
                const beforeContext = pageContent.slice(0, startIndex);
                const afterContext = pageContent.slice(endIndex + 1);
                
                results.push({
                    pageNumber: pageNumber + 1,
                    pageContent: pageContent,
                    startIndex: startIndex,
                    endIndex: endIndex,
                    beforeContext: beforeContext,
                    afterContext: afterContext
                });
            }
            
            showSearchResults(searchText, results);
        }
    });
}

// 显示搜索结果
function showSearchResults(searchText: string, results: SearchResult[]): void {
    if (results.length === 0) {
        vscode.window.showInformationMessage(`未找到匹配内容: "${searchText}"`).then();
        return;
    }
    
    // 创建 QuickPick 项
    const items: vscode.QuickPickItem[] = results.map((result, index) => {
        // 构建上下文显示
        let context = '';
        if (result.beforeContext) {
            context += result.beforeContext.length === 20 ? '...' : '';
            context += result.beforeContext;
        }
        
        context += searchText; // 添加搜索文本
        
        if (result.afterContext) {
            context += result.afterContext;
            context += result.afterContext.length === 20 ? '...' : '';
        }
        
        return {
            label: `第 ${result.pageNumber} 页`,
            description: context,
            detail: `匹配 ${index + 1}/${results.length}`
        };
    });
    
    // 显示 QuickPick
    const quickPick = vscode.window.createQuickPick();
    quickPick.items = items;
    quickPick.placeholder = `找到 ${results.length} 个匹配项，选择一个跳转`;
    quickPick.onDidChangeSelection(selection => {
        if (selection[0]) {
            const selectedIndex = items.indexOf(selection[0]);
            if (selectedIndex !== -1) {
                const selectedResult = results[selectedIndex];
                jumpToPage(selectedResult.pageNumber);
                quickPick.hide();
            }
        }
    });
    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
}

// 跳转到指定页
function jumpToPage(pageNumber: number): void {
    // 直接设置位置并显示
    configr.SetPosition(pageNumber);
    Write();
    
    vscode.window.showInformationMessage(`已跳转到第 ${pageNumber} 页`).then();
}


//*//   配置更新
function CheckConfigVersion() {
    const ConfigVersionTag: number = configr.GetConfigVersionTag() | 0;
    if (ConfigVersionTag < 2) {
        configr.SetSign("default", '/// ');
        configr.SetWordsLimit(20);
        configr.SetPosition(0);
        configr.SetTotalLine(0);
        try {
            fse.accessSync(cacheFolder);
        } catch {
            fse.mkdirSync(cacheFolder);
        }
        const tempstats = fse.statSync(cacheFolder);
        if (!tempstats.isDirectory()) {
            fse.unlinkSync(cacheFolder);
            fse.mkdirSync(cacheFolder);
        }
        fse.writeFileSync(cacheFile, mtb.encode(""));
        fse.writeFileSync(sourceFile, mtb.encode(""));
        configr.SetConfigVersionTag(3);
    } else if (ConfigVersionTag < 3) {
        configr.SetSign("default", '/// ');
        configr.SetWordsLimit(20);
        
        let NowWordsLimit: number = vscode.workspace.getConfiguration().get("txt-read-in-code-comments.WordsLimit", 20);
        fse.copyFile(cacheFile, sourceFile);
        let count: number = configr.GetPosition();
        
        let buffer = fse.readFileSync(sourceFile);
        Build(buffer, mtb.detect(buffer), NowWordsLimit);
        
        let position: number = 0;
        ++ NowWordsLimit;
        buffer = Buffer.alloc(NowWordsLimit * 4, 0);
        while (count >= 0) {
            fse.readSync(readingFile, buffer, 0, NowWordsLimit * 4, position * NowWordsLimit * 4);
            count -= mtb.decode(buffer).replaceAll('\uF888', '').length;
            ++ position;
        }
        configr.SetPosition(position - 1);
        configr.SetConfigVersionTag(3);
    }
}
//*//

//*//   入口函数
function activate(context: vscode.ExtensionContext): void {
    // // 极端错误处理
    //if (EXTREME_ERROR) {
    //    vscode.window.showErrorMessage('程序遭遇极端错误，请联系开发者，如需重新启动，请禁用并重新启用本插件');
    //    return;
    //}
    
    
    // 全局变量初始化
    cacheFolder = context.globalStorageUri.fsPath + '/';
    cacheFile = cacheFolder + "cacheFile";
    sourceFile = cacheFolder + "sourceFile";
    configr = new Configr(context);
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = "";
    statusBarItem.command = "txt-read-in-code-comments.hide";
    
    ///*
    //
    //configr.SetConfigVersionTag(2);
    //configr.SetWordsLimit(20);
    //configr.SetSign("default", '/// ');
    //
    ////*/
    
    CheckConfigVersion();
    
    readingFile = fse.openSync(cacheFile, 'r');
    
    
    // 注册命令
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.init', WorkInit));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.next', WorkNext));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.last', WorkLast));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.hide', WorkHide));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.turn', WorkTurn));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.settings', WorkSet));
    context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.search', WorkSearch));
    
}
//*//

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
}