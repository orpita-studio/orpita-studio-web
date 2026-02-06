import { Helpers } from '../utils/helpers.js';
import { StarConditions } from '../conditions/star-conditions.js';

export class ConfigGenerator {
    static generate(logFn) {
        // 1. تحديد أبعاد الشبكة
        const cols = Helpers.getRandom(Helpers.getVal('aiGridXMin'), Helpers.getVal('aiGridXMax'));
        const rows = Helpers.getRandom(Helpers.getVal('aiGridYMin'), Helpers.getVal('aiGridYMax'));
        const totalCells = cols * rows;
        const maxAllowedTotal = Math.floor(totalCells / 2);

        // 2. تجهيز المصفوفة العشوائية
        const allIndices = Array.from({ length: totalCells }, (_, i) => i);
        Helpers.shuffleArray(allIndices);

        // 3. تعريف العناصر النشطة (التي تأخذ مكاناً في الشبكة)
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
            if (t.desire > 0.6 * maxAllowedTotal) t.desire = 0.6 * maxAllowedTotal;
            totalDesire += t.desire;
        });

        // 4. تطبيق التوزين العادل للعناصر المكانية
        const scale = totalDesire > maxAllowedTotal ? (maxAllowedTotal / totalDesire) : 1;

        const results = { Blocks: [], Switches: [], MustBombs: [] };
        
        activeTypes.forEach(t => {
            const finalCount = Math.floor(t.desire * scale);
            results[t.id] = allIndices.splice(0, finalCount);
        });

        // ============================================
        // 5. حساب القنابل مع نظام التوزين العادل
        // ============================================
        
        const bombTypes = [
            { id: 'bombs1', chk: 'aiAllowBombs1', min: 'aiBombs1Min', max: 'aiBombs1Max' },
            { id: 'bombs2', chk: 'aiAllowBombs2', min: 'aiBombs2Min', max: 'aiBombs2Max' },
            { id: 'bombsNeg', chk: 'aiAllowBombsNeg', min: 'aiBombsNegMin', max: 'aiBombsNegMax' }
        ];

        let activeBombTypes = bombTypes.filter(b => Helpers.getChecked(b.chk));
        let totalBombDesire = 0;

        // نجيب الرغبات من ranges المستخدم (بدون فرض حدود)
        activeBombTypes.forEach(b => {
            b.desire = Helpers.getRandom(Helpers.getVal(b.min), Helpers.getVal(b.max));
            totalBombDesire += b.desire;
        });

        // ✅ نحسب "الحد المعقول" = أقصى قيمة ممكنة من مجموع الـ max values
        // (لو المستخدم حاط ranges صغيرة، الحد هيكون صغير تلقائيًا)
        const maxPossibleBombs = activeBombTypes.reduce((sum, b) => {
            return sum + Helpers.getVal(b.max);
        }, 0);

        // نستخدم الأصغر بين: (مجموع الـ max) أو (عدد الخلايا)
        // عشان نضمن إننا مش هنتجاوز المنطق
        const maxAllowedBombs = Math.min(maxPossibleBombs, totalCells);

        // ✅ التوزين بيحصل فقط لو المجموع تجاوز الحد "الطبيعي"
        const bombScale = totalBombDesire > maxAllowedBombs 
            ? (maxAllowedBombs / totalBombDesire) 
            : 1;

        const bombCounts = { bombs1: 0, bombs2: 0, bombsNeg: 0 };

        activeBombTypes.forEach(b => {
            bombCounts[b.id] = Math.floor(b.desire * bombScale);
        });

        // ============================================
        // 6. بناء الـ config النهائي
        // ============================================
        
        const config = {
            rows, cols,
            blocks: results.Blocks,
            switches: results.Switches,
            mustBombs: results.MustBombs,
            bombs1: bombCounts.bombs1,
            bombs2: bombCounts.bombs2,
            bombsNeg: bombCounts.bombsNeg,
            tmin: -Infinity,
            tmax: Infinity,
            maxSolutions: 5000,
            maxAnalysisSolutions: Helpers.getVal('aiAnalysisLimit') || 100000000,
            starConditions: []
        };

        // 7. توليد شروط النجوم
        config.starConditions = StarConditions.generate(config, logFn);

        return config;
    }
}