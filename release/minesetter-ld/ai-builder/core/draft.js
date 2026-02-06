import { Helpers } from '../utils/helpers.js';
import { StarConditions } from '../conditions/star-conditions.js';

export class ConfigGenerator {
    static generate(logFn) {
        // 1. تحديد أبعاد الشبكة
        const cols = Helpers.getRandom(Helpers.getVal('aiGridXMin'), Helpers.getVal('aiGridXMax'));
        const rows = Helpers.getRandom(Helpers.getVal('aiGridYMin'), Helpers.getVal('aiGridYMax'));
        const totalCells = cols * rows;
        const maxAllowedTotal = Math.floor(totalCells / 2); // مجموع العناصر لا يتخطى نصف المساحة

        // 2. تجهيز المصفوفة العشوائية
        const allIndices = Array.from({ length: totalCells }, (_, i) => i);
        Helpers.shuffleArray(allIndices);

        // 3. تعريف العناصر النشطة وجمع "رغبات" المستخدم
        const types = [
            { id: 'Blocks', chk: 'aiAllowBlocks', min: 'aiBlocksMin', max: 'aiBlocksMax' },
            { id: 'Switches', chk: 'aiAllowSwitches', min: 'aiSwitchesMin', max: 'aiSwitchesMax' },
            { id: 'MustBombs', chk: 'aiAllowMustBombs', min: 'aiMustBombsMin', max: 'aiMustBombsMax' }
        ];

        let activeTypes = types.filter(t => Helpers.getChecked(t.chk));
        let totalDesire = 0;

        activeTypes.forEach(t => {
            t.desire = Helpers.getRandom(Helpers.getVal(t.min), Helpers.getVal(t.max));
            
            if (t.id === 'Switches' && t.desire > 5) {
                    t.desire = 5;
                }
// لضمان شرطك: أي عنصر بمفرده لا يتجاوز نصف المساحة
            if (t.desire > 0.6*maxAllowedTotal) t.desire = 0.6*maxAllowedTotal;
            totalDesire += t.desire;
        });

        // 4. تطبيق "قانون التوزين العادل" (Scaling)
        // إذا كان المجموع المطلوب أكبر من نصف المساحة، نصغر الجميع بنفس النسبة
        const scale = totalDesire > maxAllowedTotal ? (maxAllowedTotal / totalDesire) : 1;

        const results = { Blocks: [], Switches: [], MustBombs: [] };
        
        activeTypes.forEach(t => {
            const finalCount = Math.floor(t.desire * scale);
            // سحب العناصر مباشرة من المصفوفة المشوشة
            results[t.id] = allIndices.splice(0, finalCount);
        });

        // 5. حساب أعداد القنابل (التي لا تأخذ مكاناً في الخلايا)
        const getBombCount = (chkId, minId, maxId) => {
            if (!Helpers.getChecked(chkId)) return 0;
            return Helpers.getRandom(Helpers.getVal(minId), Helpers.getVal(maxId));
        };

        const config = {
            rows, cols,
            blocks: results.Blocks,
            switches: results.Switches,
            mustBombs: results.MustBombs,
            bombs1: getBombCount('aiAllowBombs1', 'aiBombs1Min', 'aiBombs1Max'),
            bombs2: getBombCount('aiAllowBombs2', 'aiBombs2Min', 'aiBombs2Max'),
            bombsNeg: getBombCount('aiAllowBombsNeg', 'aiBombsNegMin', 'aiBombsNegMax'),
            tmin: -Infinity,
            tmax: Infinity,
            maxSolutions: 5000,
            maxAnalysisSolutions: Helpers.getVal('aiAnalysisLimit') || 100000000,
            starConditions: []
        };

        // 6. توليد شروط النجوم
        config.starConditions = StarConditions.generate(config, logFn);

        return config;
    }
}