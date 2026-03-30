export interface DailyVerse {
  text: string;
  reference: string;
  topic: string;
}

/**
 * 90 daily verses — KJV text, mixed Old Testament and New Testament.
 * The homepage rotates through these based on the day of the year.
 */
export const dailyVerses: DailyVerse[] = [
  // ── Old Testament (30 verses) ───────────────────────────────────
  {
    text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
    reference: "Proverbs 3:5-6",
    topic: "trust",
  },
  {
    text: "The LORD is my shepherd; I shall not want.",
    reference: "Psalm 23:1",
    topic: "provision",
  },
  {
    text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
    reference: "Isaiah 41:10",
    topic: "courage",
  },
  {
    text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
    reference: "Jeremiah 29:11",
    topic: "hope",
  },
  {
    text: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
    reference: "Joshua 1:9",
    topic: "courage",
  },
  {
    text: "The LORD bless thee, and keep thee: The LORD make his face shine upon thee, and be gracious unto thee.",
    reference: "Numbers 6:24-25",
    topic: "blessing",
  },
  {
    text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
    reference: "Isaiah 40:31",
    topic: "patience",
  },
  {
    text: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart.",
    reference: "Psalm 37:4",
    topic: "joy",
  },
  {
    text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?",
    reference: "Psalm 27:1",
    topic: "faith",
  },
  {
    text: "He hath made every thing beautiful in his time: also he hath set the world in their heart, so that no man can find out the work that God maketh from the beginning to the end.",
    reference: "Ecclesiastes 3:11",
    topic: "purpose",
  },
  {
    text: "Commit thy works unto the LORD, and thy thoughts shall be established.",
    reference: "Proverbs 16:3",
    topic: "work",
  },
  {
    text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
    reference: "Psalm 34:18",
    topic: "comfort",
  },
  {
    text: "Create in me a clean heart, O God; and renew a right spirit within me.",
    reference: "Psalm 51:10",
    topic: "renewal",
  },
  {
    text: "As for God, his way is perfect: the word of the LORD is tried: he is a buckler to all those that trust in him.",
    reference: "Psalm 18:30",
    topic: "trust",
  },
  {
    text: "The heavens declare the glory of God; and the firmament sheweth his handywork.",
    reference: "Psalm 19:1",
    topic: "creation",
  },
  {
    text: "The fear of the LORD is the beginning of wisdom: and the knowledge of the holy is understanding.",
    reference: "Proverbs 9:10",
    topic: "wisdom",
  },
  {
    text: "Thy word is a lamp unto my feet, and a light unto my path.",
    reference: "Psalm 119:105",
    topic: "guidance",
  },
  {
    text: "The LORD is gracious, and full of compassion; slow to anger, and of great mercy.",
    reference: "Psalm 145:8",
    topic: "mercy",
  },
  {
    text: "He healeth the broken in heart, and bindeth up their wounds.",
    reference: "Psalm 147:3",
    topic: "healing",
  },
  {
    text: "In the beginning God created the heaven and the earth.",
    reference: "Genesis 1:1",
    topic: "creation",
  },
  {
    text: "And thou shalt love the LORD thy God with all thine heart, and with all thy soul, and with all thy might.",
    reference: "Deuteronomy 6:5",
    topic: "love",
  },
  {
    text: "The LORD is my rock, and my fortress, and my deliverer; my God, my strength, in whom I will trust.",
    reference: "Psalm 18:2",
    topic: "strength",
  },
  {
    text: "Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD.",
    reference: "Psalm 27:14",
    topic: "patience",
  },
  {
    text: "For the LORD God is a sun and shield: the LORD will give grace and glory: no good thing will he withhold from them that walk uprightly.",
    reference: "Psalm 84:11",
    topic: "provision",
  },
  {
    text: "A merry heart doeth good like a medicine: but a broken spirit drieth the bones.",
    reference: "Proverbs 17:22",
    topic: "joy",
  },
  {
    text: "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.",
    reference: "Proverbs 27:17",
    topic: "community",
  },
  {
    text: "The name of the LORD is a strong tower: the righteous runneth into it, and is safe.",
    reference: "Proverbs 18:10",
    topic: "protection",
  },
  {
    text: "As the hart panteth after the water brooks, so panteth my soul after thee, O God.",
    reference: "Psalm 42:1",
    topic: "devotion",
  },
  {
    text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
    reference: "Lamentations 3:22-23",
    topic: "faithfulness",
  },
  {
    text: "Humble yourselves in the sight of the Lord, and he shall lift you up.",
    reference: "James 4:10",
    topic: "humility",
  },
  // ── New Testament (30 verses) ───────────────────────────────────
  {
    text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
    reference: "John 3:16",
    topic: "salvation",
  },
  {
    text: "I can do all things through Christ which strengtheneth me.",
    reference: "Philippians 4:13",
    topic: "strength",
  },
  {
    text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
    reference: "Romans 8:28",
    topic: "purpose",
  },
  {
    text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
    reference: "Matthew 6:33",
    topic: "priorities",
  },
  {
    text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
    reference: "Matthew 11:28",
    topic: "rest",
  },
  {
    text: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.",
    reference: "Romans 12:2",
    topic: "transformation",
  },
  {
    text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.",
    reference: "John 14:27",
    topic: "peace",
  },
  {
    text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance: against such there is no law.",
    reference: "Galatians 5:22-23",
    topic: "character",
  },
  {
    text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.",
    reference: "Ephesians 2:8-9",
    topic: "grace",
  },
  {
    text: "Jesus said unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
    reference: "John 14:6",
    topic: "truth",
  },
  {
    text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
    reference: "Philippians 4:6-7",
    topic: "prayer",
  },
  {
    text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.",
    reference: "1 John 1:9",
    topic: "forgiveness",
  },
  {
    text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.",
    reference: "2 Corinthians 5:17",
    topic: "renewal",
  },
  {
    text: "The Lord is not slack concerning his promise, as some men count slackness; but is longsuffering to us-ward, not willing that any should perish, but that all should come to repentance.",
    reference: "2 Peter 3:9",
    topic: "patience",
  },
  {
    text: "Casting all your care upon him; for he careth for you.",
    reference: "1 Peter 5:7",
    topic: "trust",
  },
  {
    text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
    reference: "2 Timothy 1:7",
    topic: "courage",
  },
  {
    text: "Let us hold fast the profession of our faith without wavering; for he is faithful that promised.",
    reference: "Hebrews 10:23",
    topic: "faithfulness",
  },
  {
    text: "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.",
    reference: "Romans 5:8",
    topic: "love",
  },
  {
    text: "Be ye therefore perfect, even as your Father which is in heaven is perfect.",
    reference: "Matthew 5:48",
    topic: "holiness",
  },
  {
    text: "The thief cometh not, but for to steal, and to kill, and to destroy: I am come that they might have life, and that they might have it more abundantly.",
    reference: "John 10:10",
    topic: "abundance",
  },
  {
    text: "Beloved, let us love one another: for love is of God; and every one that loveth is born of God, and knoweth God.",
    reference: "1 John 4:7",
    topic: "love",
  },
  {
    text: "Set your affection on things above, not on things on the earth.",
    reference: "Colossians 3:2",
    topic: "priorities",
  },
  {
    text: "For where two or three are gathered together in my name, there am I in the midst of them.",
    reference: "Matthew 18:20",
    topic: "community",
  },
  {
    text: "Now faith is the substance of things hoped for, the evidence of things not seen.",
    reference: "Hebrews 11:1",
    topic: "faith",
  },
  {
    text: "Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ.",
    reference: "Philippians 1:6",
    topic: "perseverance",
  },
  {
    text: "Let all bitterness, and wrath, and anger, and clamour, and evil speaking, be put away from you, with all malice: And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
    reference: "Ephesians 4:31-32",
    topic: "forgiveness",
  },
  {
    text: "I have fought a good fight, I have finished my course, I have kept the faith.",
    reference: "2 Timothy 4:7",
    topic: "perseverance",
  },
  {
    text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.",
    reference: "Galatians 6:9",
    topic: "perseverance",
  },
  {
    text: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.",
    reference: "Romans 8:38-39",
    topic: "assurance",
  },

  // ── Additional Old Testament (15 verses) ────────────────────────
  {
    text: "The LORD is my strength and my shield; my heart trusted in him, and I am helped: therefore my heart greatly rejoiceth; and with my song will I praise him.",
    reference: "Psalm 28:7",
    topic: "praise",
  },
  {
    text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
    reference: "Joshua 1:9",
    topic: "obedience",
  },
  {
    text: "But the mercy of the LORD is from everlasting to everlasting upon them that fear him, and his righteousness unto children's children.",
    reference: "Psalm 103:17",
    topic: "mercy",
  },
  {
    text: "For thou art my rock and my fortress; therefore for thy name's sake lead me, and guide me.",
    reference: "Psalm 31:3",
    topic: "guidance",
  },
  {
    text: "The LORD shall preserve thee from all evil: he shall preserve thy soul. The LORD shall preserve thy going out and thy coming in from this time forth, and even for evermore.",
    reference: "Psalm 121:7-8",
    topic: "protection",
  },
  {
    text: "Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful.",
    reference: "Psalm 1:1",
    topic: "righteousness",
  },
  {
    text: "Every word of God is pure: he is a shield unto them that put their trust in him.",
    reference: "Proverbs 30:5",
    topic: "scripture",
  },
  {
    text: "The LORD thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy; he will rest in his love, he will joy over thee with singing.",
    reference: "Zephaniah 3:17",
    topic: "joy",
  },
  {
    text: "O taste and see that the LORD is good: blessed is the man that trusteth in him.",
    reference: "Psalm 34:8",
    topic: "trust",
  },
  {
    text: "And God is able to make all grace abound toward you; that ye, always having all sufficiency in all things, may abound to every good work.",
    reference: "2 Corinthians 9:8",
    topic: "provision",
  },
  {
    text: "Who can find a virtuous woman? for her price is far above rubies.",
    reference: "Proverbs 31:10",
    topic: "virtue",
  },
  {
    text: "The LORD is good, a strong hold in the day of trouble; and he knoweth them that trust in him.",
    reference: "Nahum 1:7",
    topic: "refuge",
  },
  {
    text: "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?",
    reference: "Micah 6:8",
    topic: "justice",
  },
  {
    text: "The earth is the LORD's, and the fulness thereof; the world, and they that dwell therein.",
    reference: "Psalm 24:1",
    topic: "sovereignty",
  },
  {
    text: "When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee: when thou walkest through the fire, thou shalt not be burned.",
    reference: "Isaiah 43:2",
    topic: "comfort",
  },

  // ── Additional New Testament (15 verses) ────────────────────────
  {
    text: "Jesus saith unto him, Thomas, because thou hast seen me, thou hast believed: blessed are they that have not seen, and yet have believed.",
    reference: "John 20:29",
    topic: "faith",
  },
  {
    text: "There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.",
    reference: "Romans 8:1",
    topic: "freedom",
  },
  {
    text: "For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.",
    reference: "Ephesians 2:10",
    topic: "purpose",
  },
  {
    text: "Let this mind be in you, which was also in Christ Jesus.",
    reference: "Philippians 2:5",
    topic: "humility",
  },
  {
    text: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men.",
    reference: "Colossians 3:23",
    topic: "work",
  },
  {
    text: "Draw nigh to God, and he will draw nigh to you.",
    reference: "James 4:8",
    topic: "devotion",
  },
  {
    text: "Blessed are the peacemakers: for they shall be called the children of God.",
    reference: "Matthew 5:9",
    topic: "peace",
  },
  {
    text: "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
    reference: "Ephesians 4:32",
    topic: "kindness",
  },
  {
    text: "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.",
    reference: "Romans 6:23",
    topic: "salvation",
  },
  {
    text: "But my God shall supply all your need according to his riches in glory by Christ Jesus.",
    reference: "Philippians 4:19",
    topic: "provision",
  },
  {
    text: "In the beginning was the Word, and the Word was with God, and the Word was God.",
    reference: "John 1:1",
    topic: "divinity",
  },
  {
    text: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.",
    reference: "Psalm 46:10",
    topic: "stillness",
  },
  {
    text: "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.",
    reference: "Philippians 4:8",
    topic: "mindfulness",
  },
  {
    text: "The grace of the Lord Jesus Christ, and the love of God, and the communion of the Holy Ghost, be with you all.",
    reference: "2 Corinthians 13:14",
    topic: "blessing",
  },
  {
    text: "And Jesus said unto them, I am the bread of life: he that cometh to me shall never hunger; and he that believeth on me shall never thirst.",
    reference: "John 6:35",
    topic: "sustenance",
  },
];

/**
 * Returns today's verse based on the day of the year.
 * Cycles through all 90 verses, then repeats.
 */
export function getTodaysVerse(): DailyVerse {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dailyVerses[dayOfYear % dailyVerses.length];
}
