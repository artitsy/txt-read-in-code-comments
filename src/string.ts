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

export {
    formatText
}