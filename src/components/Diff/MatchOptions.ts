type MatchOptions = {
	blockSize: number
	repeatingWordsAccuracy: number
	ignoreWhitespaceDifferences: boolean
}

const MatchOptions: MatchOptions = {
	blockSize: 0,
	repeatingWordsAccuracy: 0.0,
	ignoreWhitespaceDifferences: false,
}

export default MatchOptions
