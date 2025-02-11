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

	// 读取position
	position = context.globalState.get("position", 0);
  
  hide = false;
  
	// 读取totalline
	totalLine = context.globalState.get("totalLine", 0);
  
  
	// 保证父目录存在
	try {
		fse.accessSync(cacheFolder);
	} catch (err) {
		if (err) {
			fse.mkdirSync(cacheFolder);
		} else {
			// TO-DO
			let tempstats = fse.statSync(cacheFolder);
			if (!tempstats.isDirectory()) {
				fse.unlinkSync(cacheFolder);
				fse.mkdirSync(cacheFolder);
			}
		}
	}

	function WorkInit(): void {
		vscode.window.showOpenDialog({
			canSelectFiles: true,
			canSelectMany: false,
			filters: {
				'Text': ['txt', 'in', 'out', 'ans'],
				'Code': ['c', 'cpp', 'py', 'java', 'go', 'cs', 'rs', 'php', 'html', 'css', 'js', 'json', 'xml', 'sh', 'bat', 'lua', 'sql', 'md', 'conf', 'log', 'gitignore', 'gitattributes']
			},
			openLabel: '选择'
		}).then((uri: vscode.Uri[] | undefined) => {
			if (uri && uri[0]) {
				// TO-DO
				const frmfile: string = uri[0].fsPath;
				try {
					fse.accessSync(frmfile);
				} catch (err) {
					if (err) {
						vscode.window.showErrorMessage('文件不存在或不可读！');
						console.error(`${frmfile} ${err.code === 'ENOENT' ? '不存在' : '不可读'}`);
					}
				}
				let buffer: Buffer = fse.readFileSync(frmfile);

				let encoding: string = chardet.detect(buffer) || 'utf8';

				// 测试是否为二进制文件
				for (let i = 0; i < buffer.length; i++) {
					if (buffer[i] === 0) {
						vscode.window.showErrorMessage('二进制文件不支持！');
						return;
					}
				}

				let text: string;
				if (encoding.toLowerCase() !== 'utf-8') {
					text = iconv.decode(buffer, encoding);
				} else {
					text = buffer.toString('utf8');
				}

				text = "\n" + text.replaceAll("\r", "\n") + "\n";
				text = text.replace(/\n\n+/g, "\n");
				text = text.substring(1);

				let config = ReadConfig();
				let wl = config.wordslimit;
				let tokens: string[] = text.split('\n');
				let pt = 0;

				text = '';
				for (const token of tokens) {
					for (let i = 0; i < token.length; i += wl) {
						let singlePage = token.slice(i, i + wl);
						let l = singlePage.length;
						for (let i = l; i < wl; i++) {
							singlePage += ' ';
						}
						text += singlePage;
						pt++;
					}
				}

				Buffer.from(text, 'binary')
				fse.writeFileSync(cacheFile, iconv.encode(text, 'utf32le'));

				// 初始化指针为0
				position = 0;
				context.globalState.update("position", position);
				context.globalState.update("totalLine", pt);

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
		try {
			let config: ConfigType = ReadConfig();

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

			let buffer = Buffer.alloc(config.wordslimit * 4, 0);
			fse.readSync(readingFile, buffer, 0, config.wordslimit * 4, (position - 1) * config.wordslimit * 4);

			let readText: string = iconv.decode(buffer, 'utf32le');


			return readText;
		} catch (err) {
			console.log(err);

		} finally {
			context.globalState.update("position", position);
		}
	}

	// 向工作区写入
	function Write(text: string = Read()) {
		let config: ConfigType = ReadConfig();
		// 如果不存在标志符
		if (config.editor.document.getText().indexOf(config.sign) === -1) {
			config.editor.edit(editBuilder => {
				const begin = new vscode.Position(config.editor.selection.active.line, 0);
				editBuilder.insert(begin, config.sign + "\n");
			}).then(() => {
				Write(text);
			});
			return;
		}

		for (let lineNumber = 0; lineNumber < config.editor.document.lineCount; ++lineNumber) {

			// 寻找标记位置
			let textOfThisLine: vscode.TextLine = config.editor.document.lineAt(lineNumber);
			let indexPosition: number = textOfThisLine.text.indexOf(config.sign);

			// 替换文本
			if (indexPosition !== -1) {
				indexPosition += config.sign.length;
				config.editor.edit(editBuilder => {
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

	function f_init(): void {
		hide = false;
		WorkInit();
	}
	function f_next(): void {
		hide = false;
		CheckCache();
		WorkNext();
	}
	function f_last(): void {
		hide = false;
		CheckCache();
		WorkLast();
	}
	function f_turn(): void {
		CheckCache();
		WorkTurn();
	}

	// 老板键
	var hide: boolean = false
	function f_hide(): void {
		if (hide === false) {
			Write("");
			hide = true;
		} else {
			hide = false;
			Write(text);
		}
	}

	// 注册命令
	context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.init', f_init));
	context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.next', f_next));
	context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.last', f_last));
	context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.hide', f_hide));
	context.subscriptions.push(vscode.commands.registerCommand('txt-read-in-code-comments.turn', f_turn));

	// 检查配置版本
	let ConfigVersionTag: number = context.globalState.get("ConfigVersionTag", 1);
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
			context.globalState.update("position", position);
			readingFile = fse.openSync(cacheFile, 'r');

			vscode.window.showInformationMessage('配置版本更新完成: 1 -> 2');
		}
		context.globalState.update("ConfigVersionTag", 2);
	}
}

// 判断是否在编辑器中
function InEditor(): boolean {
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return false;
	} else {
		return true;
	}
	ThrowError(ERROR_IMPOSSIBLE);
}

// 读取配置文件
type ConfigType = {
	editor: vscode.TextEditor,
	wordslimit: number,
	lang: string,
	sign: string
};
function ReadConfig(): ConfigType {
	// 读取配置文件
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	const wordslimit: number = vscode.workspace.getConfiguration().get("txt-read-in-code-comments.WordsLimit");// 每行最大字数
	const lang: string = editor.document.languageId;// 语言 ID
	const Sign: object = vscode.workspace.getConfiguration().get("txt-read-in-code-comments.Sign");// 标志符

	// 临时代码-TO-BE-MODIFIED
	let sign: string;
	if (true) {// 检查Sign
		if (typeof Sign != "object") {
			ThrowError(ERROR_SIGN_SETTING);
		}
		if (typeof Sign[lang] == "object" && typeof Sign[lang].a == "string") {
			sign = Sign[lang].a;
		}
		else if (typeof Sign["default"] == "object" && typeof Sign["default"].a == "string") {
			sign = Sign["default"].a;
		}
		else {
			ThrowError(ERROR_SIGN_SETTING);
		}
	}

	let config: ConfigType = {
		editor: editor,
		wordslimit: wordslimit,
		lang: lang,
		sign: sign
	}
	if (CheckConfig(config) == false) {
		ThrowError(ERROR_IMPOSSIBLE);
	}
	return config;
}

// 检测配置文件
function CheckConfig(config: ConfigType): boolean {
	// 检查WordsLimit
	if ((config.wordslimit > 0) == false) {
		ThrowError(ERROR_WORDSLIMIT);
		return false;
	}

	return true;

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