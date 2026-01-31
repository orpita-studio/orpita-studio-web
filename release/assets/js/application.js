// 1. قاموس البيانات الموحد (Translations)
const pageTranslations = {
    en: {
        steps: [
            { 
                title: "Apply", 
                desc: "Find a role that fits you and hit apply. It takes just a few minutes!", 
                icon: "form-edit.svg" 
            },
            { 
                title: "We Got It", 
                desc: "You'll get a confirmation email right away. We read every application!", 
                icon: "gmail.svg" 
            },
            { 
                title: "Quick Review", 
                desc: "Our team will review your profile. If it's a match, expect a WhatsApp message within 3-7 days.", 
                icon: "whatsapp.svg" 
            },
            { 
                title: "Let's Talk", 
                desc: "We'll have a casual chat on Google Meet. Just be yourself and show us what you've got!", 
                icon: "google-meet.svg" 
            },
            { 
                title: "Welcome to Orpita", 
                desc: "If we're a fit, you'll get an offer via WhatsApp and all the details to get started!", 
                icon: "done.svg" 
            }
        ],
        jobs: [
            {
                title: "Unity Game Developer",
                type: "Remote • Game Development",
                icon: "/assets/svg/unity.svg",
                description: "Ready to build games that people actually play? You'll own entire game features and bring ideas to life. We work in sprints, track progress with tasks, and celebrate wins together. There's a short training period where we'll sync you up with how we work. This is your chance to grow with us from the ground up.",
                requirements: [
                    "You know C# well and understand how objects work in programming",
                    "You care about writing clean code that others can read",
                    "You've used Git or GitHub before (we'll teach you our workflow)",
                    "You have something to show us—a game, a demo, or a portfolio",
                    "You love solving problems and picking up new tools quickly"
                ],
                delay: "0.1s"
            },
            {
                title: "2D Game Artist",
                type: "Remote • Art & Design",
                icon: "/assets/svg/digital-artist.svg",
                description: "Your art will be the first thing players see. Whether you do vector, hand-drawn, or both—we want your unique style. You'll work on real game assets that ship to players. We'll guide you through what makes game art different from regular art during training.",
                requirements: [
                    "A portfolio that shows your style (vector, hand-drawn, or mixed)",
                    "You can take a rough idea and turn it into something beautiful",
                    "You understand colors, lighting, and composition"
                ],
                delay: "0.2s"
            },
            {
                title: "2D Game Animator",
                type: "Remote • Animation",
                icon: "/assets/svg/animator.svg",
                description: "Make our games move! We need animators who can breathe life into characters and UI. Your work will define how the game feels. We'll show you how to prepare animations for game engines during your onboarding.",
                requirements: [
                    "Portfolio showing your 2D animation work",
                    "You get timing, weight, and how things should move",
                    "You can create smooth loops and action sequences",
                    "You're committed to hitting deadlines without sacrificing quality",
                    "Ready to learn the technical side of game animation"
                ],
                delay: "0.3s"
            },
            {
                title: "Game Designer",
                type: "Remote • Creative Design",
                icon: "/assets/svg/brain.svg",
                description: "Got wild game ideas? We're looking for someone who thinks about gameplay, balance, and what makes games fun. You'll design mechanics, write game docs, and work between artists and developers. We'll teach you how to turn ideas into actual game systems.",
                requirements: [
                    "You're creative and obsessed with details",
                    "You can write clear docs that explain complex ideas simply",
                    "You love researching and learning new things on your own",
                    "Bonus if you know basic logic or coding concepts",
                    "You're comfortable with math or willing to learn game balance formulas",
                    "You communicate well and can talk to both artists and coders"
                ],
                delay: "0.4s"
            },
            {
                title: "Social Media Designer",
                type: "Remote • Media & Design",
                icon: "/assets/svg/vector.svg",
                description: "Help us stand out online. You'll design posts, stories, and anything else we need to look good on social media. Your work will represent Orpita to the world. We move fast, so flexibility is key.",
                requirements: [
                    "Experience designing for Instagram, Facebook, TikTok, etc.",
                    "You create eye-catching content that fits our brand",
                    "You handle feedback well and make changes quickly",
                    "Portfolio showing social media work you're proud of",
                    "You deliver on time and keep our feed fresh",
                    "You know what's trending and what works on different platforms"
                ],
                delay: "0.5s"
            },
            {
                title: "Video Editor & Content Creator",
                type: "Alexandria Only • Media Production",
                icon: "/assets/svg/film.svg",
                description: "Think you can make Orpita go viral? We need someone to create Reels, TikToks, and game trailers that grab attention fast. You don't need 10 years of experience—just a creative eye and the drive to try new things.",
                requirements: [
                    "You can edit punchy short-form videos that hook people instantly",
                    "You know how to grab attention in the first 3 seconds",
                    "Basic skills with video tools (CapCut, InShot, or desktop software)",
                    "You follow trends and know what makes content shareable",
                    "You're willing to experiment with different styles",
                    "You deliver content that keeps our audience engaged"
                ],
                delay: "0.6s"
            },
            {
                title: "HR Specialist",
                type: "Remote • People & Culture",
                icon: "/assets/svg/people.svg",
                description: "Help us build the team. We need someone organized, caring, and good with people. You'll manage applications, onboard new members, and keep everyone connected. We'll train you on our systems and how to run training sessions.",
                requirements: [
                    "Comfortable with Google Sheets, Docs, and Drive",
                    "Super organized and detail-oriented",
                    "Great communication skills—you'll be the team's go-to person",
                    "You genuinely enjoy helping people succeed",
                    "Willing to learn our management and training systems",
                    "Responsible for tracking team progress and milestones"
                ],
                delay: "0.7s"
            },
            {
                title: "Technical Artist (2D)",
                type: "Remote • Game Development",
                icon: "/assets/svg/vfx.svg",
                description: "You're the bridge between art and code. You'll bring 2D art into Unity, make it look stunning, and keep it running smoothly. Think shaders, effects, and optimization. If art meets tech excites you, this is it.",
                requirements: [
                    "Solid understanding of Unity for 2D games",
                    "You can import and set up 2D assets (sprites, atlases, etc.)",
                    "Know your way around Unity's 2D tools—lighting, post-processing, particles",
                    "You make art look better through technical magic",
                    "You troubleshoot visual issues and optimize for performance"
                ],
                delay: "0.8s"
            }
        ],
        ui: {
            readMore: "Read More ▼",
            readLess: "Read Less ▲",
            applyBtn: "Apply Now",
            askBtn: "Ask Us About This Role",
            waMsg: "Hi Orpita! I'm interested in the ",
            noJobs: "No openings right now—but follow us for updates!",
            followUs: "Follow us on social media for updates"
        }
    },
    ar: {
        steps: [
            { 
                title: "قدّم الآن", 
                desc: "اختار الوظيفة اللي تناسبك واضغط قدّم. الموضوع ما ياخدش دقايق!", 
                icon: "form-edit.svg" 
            },
            { 
                title: "وصلنا طلبك", 
                desc: "هتوصلك رسالة تأكيد على طول. إحنا بنقرا كل الطلبات!", 
                icon: "gmail.svg" 
            },
            { 
                title: "مراجعة سريعة", 
                desc: "الفريق هيراجع ملفك. لو شايفين إنك مناسب، هنكلمك على WhatsApp خلال 3-7 أيام.", 
                icon: "whatsapp.svg" 
            },
            { 
                title: "خلينا نتكلم", 
                desc: "هنعمل محادثة بسيطة على Google Meet. كن على طبيعتك وورينا شغلك!", 
                icon: "google-meet.svg" 
            },
            { 
                title: "أهلاً بيك في Orpita", 
                desc: "لو شايفين إنك مناسب، هتوصلك رسالة العرض على WhatsApp وكل التفاصيل علشان تبدأ!", 
                icon: "done.svg" 
            }
        ],
        jobs: [
            {
                title: "Unity Game Developer",
                type: "عن بُعد • تطوير الألعاب",
                icon: "/assets/svg/unity.svg",
                description: "مستعد تبني ألعاب الناس فعلاً تلعبها؟ هتكون مسؤول عن Features كاملة في اللعبة وتحول الأفكار لحقيقة. إحنا بنشتغل بنظام Tasks، بنتابع التقدم، ونحتفل بالإنجازات مع بعض. في فترة تدريب قصيرة في الأول علشان نعلمك طريقة شغلنا. دي فرصتك تكبر معانا من الأول.",
                requirements: [
                    "بتعرف C# كويس وفاهم البرمجة الكائنية (OOP)",
                    "مهتم إنك تكتب Code نضيف وسهل الناس تفهمه",
                    "استخدمت Git أو GitHub قبل كده (إحنا هنعلمك Workflow بتاعنا)",
                    "عندك حاجة تورينا إياها—لعبة، Demo، أو Portfolio",
                    "بتحب حل المشاكل وسريع في تعلم Tools جديدة"
                ],
                delay: "0.1s"
            },
            {
                title: "2D Game Artist",
                type: "عن بُعد • الفن والتصميم",
                icon: "/assets/svg/digital-artist.svg",
                description: "الرسم بتاعك هيكون أول حاجة اللاعبين يشوفوها. سواء بتشتغل Vector أو Hand-drawn أو الاتنين—إحنا عاوزين Style الخاص بيك. هتشتغل على Assets حقيقية هتوصل للاعبين. وإحنا هنعلمك إيه الفرق بين Game Art والرسم العادي في فترة التدريب.",
                requirements: [
                    "Portfolio يوضح Style بتاعك (Vector، Hand-drawn، أو مكس)",
                    "تقدر تاخد فكرة بسيطة وتحولها لحاجة جميلة",
                    "فاهم الألوان، الإضاءة، والتكوين (Composition)"
                ],
                delay: "0.2s"
            },
            {
                title: "2D Game Animator",
                type: "عن بُعد • الرسوم المتحركة",
                icon: "/assets/svg/animator.svg",
                description: "خلي ألعابنا تتحرك! محتاجين Animators يقدروا يدوا حياة للشخصيات وال UI. شغلك هو اللي هيحدد إحساس اللعبة. وإحنا هنعلمك تجهز Animations لل Game Engines في فترة التدريب.",
                requirements: [
                    "Portfolio فيه شغل Animation بتاعك",
                    "فاهم Timing، الوزن، وإزاي الحاجات المفروض تتحرك",
                    "تقدر تعمل Loops ناعمة و Action Sequences",
                    "ملتزم بمواعيد التسليم من غير ما تضحي بالجودة",
                    "مستعد تتعلم الجانب التقني من Game Animation"
                ],
                delay: "0.3s"
            },
            {
                title: "Game Designer",
                type: "عن بُعد • التصميم الإبداعي",
                icon: "/assets/svg/brain.svg",
                description: "عندك أفكار ألعاب جامدة؟ بندور على حد يفكر في Gameplay، التوازن، وإيه اللي يخلي الألعاب ممتعة. هتصمم Mechanics، تكتب Game Docs، وتشتغل بين الرسامين والمبرمجين. إحنا هنعلمك تحول الأفكار لأنظمة ألعاب حقيقية.",
                requirements: [
                    "مبدع ومهووس بالتفاصيل",
                    "تقدر تكتب Docs واضحة تشرح أفكار معقدة ببساطة",
                    "بتحب البحث والتعلم الذاتي",
                    "ميزة إضافية لو تعرف Logic أو مفاهيم Coding أساسية",
                    "مرتاح مع الرياضيات أو مستعد تتعلم معادلات Game Balance",
                    "بتعرف تتواصل كويس مع الرسامين والمبرمجين"
                ],
                delay: "0.4s"
            },
            {
                title: "Social Media Designer",
                type: "عن بُعد • الوسائط والتصميم",
                icon: "/assets/svg/vector.svg",
                description: "ساعدنا نكون مميزين Online. هتصمم Posts، Stories، وأي حاجة تانية نحتاجها علشان نظهر كويس على Social Media. شغلك هيمثل Orpita للعالم. إحنا بنتحرك بسرعة، فالمرونة مهمة.",
                requirements: [
                    "عندك خبرة في التصميم لـ Instagram، Facebook، TikTok، إلخ",
                    "بتعمل محتوى جذاب يناسب Brand بتاعنا",
                    "بتتعامل مع Feedback كويس وتعمل التعديلات بسرعة",
                    "Portfolio فيه شغل Social Media فخور بيه",
                    "بتسلم في المواعيد وتخلي Feed بتاعنا Fresh",
                    "عارف Trends إيه وإيه اللي بيشتغل على Platforms مختلفة"
                ],
                delay: "0.5s"
            },
            {
                title: "Video Editor & Content Creator",
                type: "الإسكندرية فقط • إنتاج الوسائط",
                icon: "/assets/svg/film.svg",
                description: "فاكر إنك تقدر تخلي Orpita ينتشر؟ محتاجين حد يعمل Reels، TikToks، و Game Trailers تجذب الانتباه بسرعة. مش محتاج خبرة 10 سنين—بس عين مبدعة ورغبة تجرب حاجات جديدة.",
                requirements: [
                    "تقدر تعمل فيديوهات قصيرة قوية تشد الناس من أول ثانية",
                    "عارف إزاي تجذب الانتباه في أول 3 ثواني",
                    "مهارات أساسية في Tools الفيديو (CapCut، InShot، أو برامج Desktop)",
                    "بتتابع Trends وعارف إيه اللي يخلي المحتوى ينتشر",
                    "مستعد تجرب Styles مختلفة",
                    "بتسلم محتوى يخلي الجمهور متفاعل"
                ],
                delay: "0.6s"
            },
            {
                title: "HR Specialist",
                type: "عن بُعد • الأفراد والثقافة",
                icon: "/assets/svg/people.svg",
                description: "ساعدنا نبني الفريق. محتاجين حد منظم، بيهتم بالناس، وكويس في التعامل معاهم. هتدير الطلبات، تستقبل الأعضاء الجدد، وتخلي الكل متواصل. إحنا هندربك على أنظمتنا وإزاي تدير Training Sessions.",
                requirements: [
                    "مرتاح مع Google Sheets، Docs، و Drive",
                    "منظم جداً ومهتم بالتفاصيل",
                    "مهارات تواصل ممتازة—هتكون الشخص الأساسي للفريق",
                    "فعلاً بتحب تساعد الناس تنجح",
                    "مستعد تتعلم Management و Training Systems بتوعنا",
                    "مسؤول عن متابعة تقدم الفريق والـ Milestones"
                ],
                delay: "0.7s"
            },
            {
                title: "Technical Artist (2D)",
                type: "عن بُعد • تطوير الألعاب",
                icon: "/assets/svg/vfx.svg",
                description: "إنت الجسر بين الفن والـ Code. هتدخل الـ 2D Art على Unity، تخليه يبان جامد، وتخليه يشتغل بسلاسة. فكر في Shaders، Effects، و Optimization. لو الفن مع التكنولوجيا بيشدك، دي الوظيفة المناسبة.",
                requirements: [
                    "فاهم Unity كويس خصوصاً للألعاب الـ 2D",
                    "تقدر تستورد وتجهز 2D Assets (Sprites، Atlases، إلخ)",
                    "عارف Tools الـ 2D في Unity—Lighting، Post-processing، Particles",
                    "بتخلي الفن يبان أحسن من خلال سحر تقني",
                    "بتحل مشاكل Visual و بتعمل Optimization للأداء"
                ],
                delay: "0.8s"
            }
        ],
        ui: {
            readMore: "اقرأ المزيد ▼",
            readLess: "اقرأ أقل ▲",
            applyBtn: "قدّم دلوقتي",
            askBtn: "اسألنا عن الوظيفة دي",
            waMsg: "أهلاً Orpita! أنا مهتم بوظيفة ",
            noJobs: "مفيش وظائف دلوقتي—بس تابعنا للتحديثات!",
            followUs: "تابعنا على السوشيال ميديا للتحديثات"
        }
    }
};

// Export for use in your application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = jobData;
};

// Export for use in your application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = jobData;
}


// --- وظائف البناء (Generators) ---

function renderHiringSteps(langData, isAr) {
    const container = document.getElementById('hiring-steps-container');
    if (!container) return;
    
    container.style.direction = isAr ? 'rtl' : 'ltr';
    container.className = "grid grid-cols-1 md:grid-cols-29 items-start gap-y-5 md:gap-y-0 w-full";
    
    container.innerHTML = langData.steps.map((step, index) => {
        const isLast = index === langData.steps.length - 1;
        return `
            <div class="md:col-span-5 flex flex-row md:flex-col items-start md:items-center ${isAr ? 'text-right' : 'text-left'} md:text-center group gap-2 md:gap-0">
                <div class="shrink-0 w-16 h-16 md:w-20 md:h-20 bg-slate-800 border-2 border-purple-500/30 rounded-full flex items-center justify-center md:mb-2 group-hover:border-purple-500 transition-all duration-300 shadow-lg">
                    <img src="/assets/svg/${step.icon}" class="w-6 h-6 md:w-8 md:h-8" alt="${step.title}">
                </div>
                <div class="flex flex-col">
                    <h4 class="text-white font-bold text-lg md:text-lg md:mb-3 leading-tight">${step.title}</h4>
                    <p class="text-gray-400 text-xs md:text-sm p-2">${step.desc}</p>
                </div>
            </div>

            ${!isLast ? `
                <div class="md:col-span-1 flex items-center justify-center md:h-20 ${isAr ? 'md:rotate-180 rotate-90 ' : ' rotate-90 md:rotate-0 '} opacity-50 self-start md:self-auto">
                    <img src="/assets/svg/right-arrow.svg" class="w-9 h-9" alt="arrow">
                </div>
            ` : ''}
        `;
    }).join('');
}

function createJobCard(job, ui, isAr) {
    return `
        <div class="border bg-slate-800/50 rounded-2xl border-slate-700 p-6 overflow-hidden opacity-0 animate-on-scroll ${isAr ? 'text-right' : 'text-left'}" style="animation-delay: ${job.delay};">
            <div class="flex flex-col md:flex-row ${isAr ? 'md:flex-row-reverse' : ''} items-start gap-6">
                <div class="flex-shrink-0 w-16 h-16 bg-purple-900/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                    <img src="${job.icon}" class="w-10 h-10 object-contain" alt="${job.title}" onerror="this.style.opacity='0.3'">
                </div>
                <div class="flex-grow w-full">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 class="text-xl font-bold text-white mb-1">${job.title}</h3>
                            <p class="text-gray-400 text-sm font-medium">${job.type}</p>
                        </div>
                        <button onclick="toggleDetails(this, '${ui.readMore}', '${ui.readLess}')" class="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                            ${ui.readMore}
                        </button>
                    </div>
                    <div class="max-h-0 opacity-0 overflow-hidden transition-all duration-500 ease-in-out detail-content">
                    
                        <div class="pt-6 mt-6 border-t border-gray-800 text-white text-sm leading-relaxed">
                            <p class="mb-4">${job.description}</p>
                            <h4 class="font-semibold text-white mb-3 mt-6">${isAr ? 'المتطلبات:' : 'What we\'re looking for:'}</h4>
                            <ul class="list-disc text-gray-400 ${isAr ? 'list-inside pr-4' : 'list-inside pl-4'} space-y-2">
                                ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="mt-6 flex flex-wrap items-center gap-4 ${isAr ? 'justify-start' : ''}">
                            <button onclick="toggleModal()" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-3xl transition-all">
                                ${ui.applyBtn}
                            </button>
                            <a href="https://wa.me/201203075900?text=${encodeURIComponent(ui.waMsg + job.title)}"
                               target="_blank"
                               class="border-2 border-slate-700 text-slate-300 font-bold py-2 px-6 rounded-3xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                                ${ui.askBtn}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

// --- التحكم في الصفحة (Logic) ---

function toggleDetails(btn, readMoreTxt, readLessTxt) {
    const cardContent = btn.closest('.flex-grow').querySelector('.detail-content');
    const isExpanded = cardContent.classList.contains('expanded');
    
    if (isExpanded) {
        cardContent.style.maxHeight = '0px';
        cardContent.style.opacity = '0';
        cardContent.classList.remove('expanded');
        btn.innerText = readMoreTxt;
    } else {
        cardContent.style.maxHeight = cardContent.scrollHeight + 'px';
        cardContent.style.opacity = '1';
        cardContent.classList.add('expanded');
        btn.innerText = readLessTxt;
    }
}

function toggleModal() {
    const modal = document.getElementById('jobModal');
    const content = document.getElementById('modalContent');
    if (!modal) return;
    
    const isHidden = modal.classList.contains('hidden');
    modal.classList.toggle('hidden');
    
    if (!isHidden) {
        content.classList.add('animate-fade-in-up');
        document.addEventListener('keydown', closeModalOnEsc);
    } else {
        document.removeEventListener('keydown', closeModalOnEsc);
    }
}

function closeModalOnEsc(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('jobModal');
        if (modal && !modal.classList.contains('hidden')) {
            toggleModal();
        }
    }
}

// تشغيل الوظائف عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const currentLang = window.location.pathname.includes('/ar') ? 'ar' : 'en';
    const isAr = currentLang === 'ar';
    const langData = pageTranslations[currentLang];

    renderHiringSteps(langData, isAr);

    const positionsContainer = document.getElementById('positions-container');
    if (positionsContainer) {
        positionsContainer.style.direction = isAr ? 'rtl' : 'ltr';
        
        if (langData.jobs.length === 0) {
            positionsContainer.innerHTML = `
                <div class="text-center py-12 text-gray-400">
                    <p class="text-xl mb-2">${langData.ui.noJobs}</p>
                    <p class="text-sm">${langData.ui.followUs}</p>
                </div>
            `;
        } else {
            positionsContainer.innerHTML = langData.jobs.map(job => createJobCard(job, langData.ui, isAr)).join('');
        }
    }
});