import * as vscode from 'vscode';

//*// 错误集中处理
//type ErrorType = number;                    // todo: 长得不太好看，要不用枚举类型
//const ERROR_UNKOWN: ErrorType = -1;
//const ERROR_SIGN_SETTING: ErrorType = 2;
//const ERROR_FILE_NOT_FOUND: ErrorType = 3;
//const ERROR_WORDSLIMIT: ErrorType = 4;
//const ERROR_IMPOSSIBLE: ErrorType = 114514;

export enum ErrorType {
    ERROR_UNKOWN = -1,
    ERROR_SIGN_SETTING = 2,
    ERROR_FILE_NOT_FOUND = 3,
    ERROR_WORDSLIMIT = 4,
    ERROR_IMPOSSIBLE = 114514
}

function ThrowError(err: ErrorType): void {
    switch (err) {
        case ErrorType.ERROR_UNKOWN:
            vscode.window.showErrorMessage(`未知错误(ﾟДﾟ*)ﾉ，请联系开发者`);
            ExtremeErrorExitAndDeactive(err);
            break;
        case ErrorType.ERROR_SIGN_SETTING:
            vscode.window.showErrorMessage(`请检查标志符设定╰（‵□′）╯`);
            ErrorExit(err);
            break;
        case ErrorType.ERROR_WORDSLIMIT:
            vscode.window.showErrorMessage(`请检查每行最大字数设定（￣︶￣）↗`);
            ErrorExit(err);
            break;
        case ErrorType.ERROR_IMPOSSIBLE:
            vscode.window.showErrorMessage(`不可能的错误(╯‵□′)╯︵┻━┻，你这代码有问题啊，快去嘲笑开发者。`);
            ExtremeErrorExitAndDeactive(err);
            break;
        default:
            vscode.window.showErrorMessage(`未正确处理的错误😂，请联系开发者。`);
            ExtremeErrorExitAndDeactive(err);
            break;
    }
    ThrowError(ErrorType.ERROR_IMPOSSIBLE);
}

// 因错误强制退出
function ErrorExit(err: ErrorType): never {
    throw new Error(`Error: ${err}`);
}

// 极端错误强制退出并不再被激活
var EXTREME_ERROR: boolean = false;
function ExtremeErrorExitAndDeactive(err: ErrorType): never {
    EXTREME_ERROR = true
    //deactivate();
    throw new Error(`Error: ${err}`);
}
//*//