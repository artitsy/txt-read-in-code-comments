import * as iconv from 'iconv-lite';
import * as vscode from 'vscode';
import * as chardet from 'chardet';

// 检查一个字符是否为标点符号
function isPunctuation(char: string): boolean {
    return /[，。！？；：”’】》）、,.!?;:'"\]\)>\}]/.test(char);
}

// 格式化文本
export function formatText(OriginalText: string, WordsLimit: number): string {
    let lines: string[] = 
        ("\n" + OriginalText.replaceAll("\r", "\n") + "\n")
        .replace(/\n\n+/g, "\n")
        .slice(1, -1)
        .split("\n");
    
    let book: string = "";
    
    for (const line of lines) {
        let i = 0;
        for (; i + WordsLimit < line.length; i += WordsLimit) {
            let sentence = line.slice(i, i + WordsLimit + 1);
            if (!isPunctuation(sentence.slice(-1))) {
                sentence = sentence.slice(0, -1) + '\uF888';
            } else {
                ++ i;
            }
            book += sentence;
        }
        if (i < line.length) {
            book += line.slice(i) + '\uF888'.repeat(i + WordsLimit + 1 - line.length);
        }
    }
    return book;
} 

// 测试是否为二进制文件  todo: UTF-16
export function isBinaryFile(buffer: Buffer): boolean {
    const bytesToCheck = Math.min(buffer.length, 1024);
    for (let i = 0; i < bytesToCheck; ++i) {
        if (buffer[i] === 0) {
            return true;
        }
    }
    return false;
}

// 判断编码
export function detect(buffer: Buffer): string {
    let encoding = chardet.detect(buffer.subarray(0, 131072)) || 'utf-8';
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
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        //vscode.window.showErrorMessage('不在活动的编辑器中');
        throw new Error('不在活动的编辑器中');
    }
    return editor;
}

export function GetLang(): string {
    return GetEditor().document.languageId;
}