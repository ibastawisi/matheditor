const tagRegex = /^\s*<\/?[^>]+>\s*$/
const tagWordRegex = /<[^\s>]+/
const whitespaceRegex = /^(\s|&nbsp;)+$/
const wordRegex = /[\w\#@]+/

const specialCaseWordTags = ['<img']

function isTag(item: string) {
	if (specialCaseWordTags.some((re) => item !== null && item.startsWith(re))) {
		return false
	}
	return tagRegex.test(item)
}

function stripTagAttributes(word: string) {
	let tag = tagWordRegex.exec(word)?.[0]
	word = tag + (word.endsWith('/>') ? '/>' : '>')
	return word
}

function wrapText(text: string, tagName: string, cssClass: string) {
	return ['<', tagName, ' class="', cssClass, '">', text, '</', tagName, '>'].join('')
}

function isStartOfTag(character: string) {
	return character === '<'
}

function isEndOfTag(character: string) {
	return character === '>'
}

function isStartOfEntity(character: string) {
	return character === '&'
}

function isEndOfEntity(character: string) {
	return character === ';'
}

function isWhiteSpace(character: string) {
	return whitespaceRegex.test(character)
}

function stripAnyAttributes(word: string) {
	if (isTag(word)) {
		return stripTagAttributes(word)
	}
	return word
}

function isWord(text: string) {
	return wordRegex.test(text)
}

export {
	isTag,
	stripTagAttributes,
	wrapText,
	isStartOfTag,
	isEndOfTag,
	isStartOfEntity,
	isEndOfEntity,
	isWhiteSpace,
	stripAnyAttributes,
	isWord,
}
