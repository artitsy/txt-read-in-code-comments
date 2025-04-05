import * as vscode from 'vscode';

//*//
class Configr {
    
    context: vscode.ExtensionContext;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }
    
    GetWordsLimit(): number {
        return this.context.globalState.get("WordsLimit");
    }
    
    GetSign(lang: string): string { 
        let sign:string = this.context.globalState.get("Sign-" + lang);
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
    
    GetTotalLine(): number {
        return this.context.globalState.get("totalLine");
    }
    
    SetWordsLimit(limit: number): void {
        this.context.globalState.update("WordsLimit", limit).then();
    }
    
    SetSign(lang: string, sign: string): void {
        this.context.globalState.update("Sign-" + lang, sign).then();
    }
    
    SetPosition(position: number): void {
        this.context.globalState.update("position", position).then();
    }
    
    SetConfigVersionTag(tag: number): void {
        this.context.globalState.update("ConfigVersionTag", tag).then();
    }
    
    SetTotalLine(totalLine: number): void {
        this.context.globalState.update("totalLine", totalLine).then();
    }
};
//*//   

export {
    Configr
}