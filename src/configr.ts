import * as vscode from 'vscode';

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

export {
    Configr
}