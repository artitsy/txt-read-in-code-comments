import * as vscode from 'vscode';

export enum ErrorType {
    ERROR_UNKNOWN,
    ERROR_SIGN_SETTING,
    ERROR_FILE_NOT_FOUND,
    ERROR_WORDSLIMIT,
    ERROR_IMPOSSIBLE
}

function ThrowError(err: ErrorType): void {
    switch (err) {
        case ErrorType.ERROR_UNKNOWN:
            vscode.window.showErrorMessage(`未知错误(ﾟДﾟ*)ﾉ，请联系开发者`).then();
            ExtremeErrorExitAndDeactivate(err);
            break;
        case ErrorType.ERROR_SIGN_SETTING:
            vscode.window.showErrorMessage(`请检查标志符设定╰（‵□′）╯`).then();
            ErrorExit(err);
            break;
        case ErrorType.ERROR_WORDSLIMIT:
            vscode.window.showErrorMessage(`请检查每行最大字数设定（￣︶￣）↗`).then();
            ErrorExit(err);
            break;
        case ErrorType.ERROR_IMPOSSIBLE:
            vscode.window.showErrorMessage(`不可能的错误(╯‵□′)╯︵┻━┻，你这代码有问题啊，快去嘲笑开发者。`).then();
            ExtremeErrorExitAndDeactivate(err);
            break;
        default:
            vscode.window.showErrorMessage(`未正确处理的错误😂，请联系开发者。`).then();
            ExtremeErrorExitAndDeactivate(err);
            break;
    }
    ThrowError(ErrorType.ERROR_IMPOSSIBLE);
}

// 因错误强制退出
function ErrorExit(err: ErrorType): never {
    throw new Error(`Error: ${err}`);
}

// 极端错误强制退出并不再被激活
let EXTREME_ERROR: boolean = false;

function ExtremeErrorExitAndDeactivate(err: ErrorType): never {
    EXTREME_ERROR = true
    //deactivate();
    throw new Error(`Error: ${err}`);
}
//*//