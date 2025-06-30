import * as iconv from 'iconv-lite';
import * as vscode from 'vscode';
import * as chardet from 'chardet';

// 获取实际字符数，如字符‘💩’‘👁’在string中占了两位。
export function StrLength(text: string): number {
    return Array.from(text).length;
}

// 检查一个字符是否为标点符号
function isPunctuation(char: string): boolean {
    return /[，。！？；：”’】》）、,.!?;:'"\])>}]/.test(char);
}

// 格式化文本
export function formatText(OriginalText: string, WordsLimit: number): string {
    const lines: string[] = 
        ("\n" + OriginalText.replaceAll("\r", "\n") + "\n")
        .replace(/\n\n+/g, "\n")
        .slice(1, -1)
        .split("\n");
    
    let book: string = "";
    
    for (const line of lines) {
        let i = 0;
        let sentence = "";
        let j = 0;
        for (const c of line) {
            if (j == WordsLimit) {
                if (isPunctuation(c)) {
                    book += sentence + c;
                    sentence = '';
                    j = 0;
                } else {
                    book += sentence + '\uF888';
                    sentence = c;
                    j = 1;
                }
            } else {
                sentence += c;
                ++ j;
            }
        }
        if (sentence.length > 0) {
            book += sentence + '\uF888'.repeat(WordsLimit - j + 1);
        }
    }
    return book;
} 

// 判断编码
export function detect(buffer: Buffer): string {
    const encoding = chardet.detect(buffer.subarray(0, 131072)) || 'utf-8';
    if (encoding.toLowerCase() == 'gb2312' || encoding.toLowerCase() == 'gbk') {
        return 'gb18030';
    }
    if (encoding.toLowerCase() == 'ascii') {
        return 'utf-8';
    }
    return encoding
}

// 解为 string
export function decode(buffer: Buffer, encoding: string = 'utf32le'): string {
    return iconv.decode(buffer, encoding);
}

// 编为 utf32le
export function encode(text: string): Buffer {
    return iconv.encode(text, 'utf32le');
}

// 获取编辑器
export function GetEditor(): vscode.TextEditor {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        //vscode.window.showErrorMessage('不在活动的编辑器中');
        throw new Error('不在活动的编辑器中');
    }
    return editor;
}

export function GetLang(): string {
    return GetEditor().document.languageId;
}