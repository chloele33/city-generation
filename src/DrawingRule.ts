export default class DrawingRule {
    drawingMap: Map<string, Array<[number, number]>>;
    constructor () {
        this.drawingMap = new Map<string, Array<[number, number]>>();
    }

    get(str: string): any {
        if (!this.drawingMap.has(str)) {
            return void{};
        } else {
            var ruleArray = this.drawingMap.get(str);
            var sumProb = 0.0;
            var xi = Math.random()
            let func: any;
            for (let i = 0; i < ruleArray.length; i++) {
                sumProb += ruleArray[i][1];
                if (xi <= sumProb) {
                    func = ruleArray[i][0];
                    break;
                }
            }
            return func;
        }
    }

    set(str: string, func: number, prob: number) {
        if (this.drawingMap.has(str)) {
            this.drawingMap.get(str).push([func, prob]);
        } else {
            var newRule : Array<[number, number]> = [[func, prob]];
            this.drawingMap.set(str, newRule);
        }
    }

}

