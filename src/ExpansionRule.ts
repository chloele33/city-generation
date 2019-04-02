export default class ExpansionRule {

    expMap: Map<string, Array<[string, number]>>; // string mapping to a set of string and probability pairs

    constructor() {
        this.expMap = new Map<string, Array<[string, number]>>();
    }

    expand(str: string) : string {
        var resultStr: string;
        if (!this.expMap.has(str)) {
            return "";
        } else {
            let ruleArray = this.expMap.get(str);
            let probSum = 0;
            let xi = Math.random();
            for (let i = 0; i < ruleArray.length; i++) {
                probSum += ruleArray[i][1];
                if (xi <= probSum) {
                    resultStr = resultStr + ruleArray[i][0];
                    break;
                }
            }
            return resultStr;
        }
    }

    // adds to the expansion rule, mapping from the original to the new string with a probability
    set(oriStr: string, newStr: string, prob: number) {
        if(this.expMap.has(oriStr)){
            this.expMap.get(oriStr).push([newStr, prob]); // override previous rule
        }
        else{
            var newRule : Array<[string, number]> = [[newStr, prob]];
            this.expMap.set(oriStr, newRule);
        }

    }
}
