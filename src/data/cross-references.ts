
export interface VerseReference {
  verse_ref: string;
  related_refs: string[];
  brief_commentary: string;
}

export const crossReferenceData: VerseReference[] = [
  {
    verse_ref: "John 3:16",
    related_refs: ["Romans 5:8", "1 John 4:9", "Ephesians 2:4-5"],
    brief_commentary: "This verse encapsulates the essence of the Gospel, highlighting God's immense love for humanity and the provision of eternal life through faith in Jesus Christ."
  },
  {
    verse_ref: "Philippians 4:13",
    related_refs: ["2 Corinthians 12:9-10", "Ephesians 3:16", "Colossians 1:11"],
    brief_commentary: "A declaration of strength and capability through Christ, emphasizing reliance on His power to overcome challenges and fulfill all tasks."
  },
  {
    verse_ref: "Romans 8:28",
    related_refs: ["Genesis 50:20", "Jeremiah 29:11", "1 Corinthians 2:9"],
    brief_commentary: "Assures believers that in all circumstances, God works for the good of those who love Him and are called according to His purpose, even in difficult situations."
  },
  {
    verse_ref: "Matthew 6:33",
    related_refs: ["Luke 12:31", "Proverbs 3:5-6", "1 Timothy 4:8"],
    brief_commentary: "Encourages prioritizing God's kingdom and righteousness, with the promise that all necessary things will be provided."
  },
  {
    verse_ref: "Proverbs 3:5-6",
    related_refs: ["Psalm 37:3-5", "Jeremiah 17:7-8", "Isaiah 26:3-4"],
    brief_commentary: "Exhorts believers to trust in the Lord completely, not relying on their own understanding, and promises divine guidance in all their paths."
  },
  {
    verse_ref: "Jeremiah 29:11",
    related_refs: ["Romans 8:28", "Isaiah 55:8-9", "Psalm 33:11"],
    brief_commentary: "A comforting promise from God, revealing His good plans for peace and a hopeful future for His people, not for harm."
  },
  {
    verse_ref: "Psalm 23:1",
    related_refs: ["Isaiah 40:11", "John 10:11", "Hebrews 13:20"],
    brief_commentary: "A foundational declaration of God as a shepherd who provides and cares for His people, ensuring they lack nothing."
  },
  {
    verse_ref: "Isaiah 41:10",
    related_refs: ["Deuteronomy 31:6", "Joshua 1:9", "Psalm 27:1"],
    brief_commentary: "God's powerful assurance to His people not to fear or be dismayed, promising His presence, strength, help, and upholding righteousness."
  },
  {
    verse_ref: "Romans 12:2",
    related_refs: ["Ephesians 4:23-24", "Colossians 3:10", "2 Corinthians 5:17"],
    brief_commentary: "Calls for spiritual transformation through the renewal of the mind, urging believers not to conform to worldly patterns but to discern God's will."
  },
  {
    verse_ref: "1 Corinthians 10:13",
    related_refs: ["Psalm 125:3", "2 Peter 2:9", "Hebrews 4:15"],
    brief_commentary: "Assures believers that God is faithful and will not allow them to be tempted beyond what they can bear, always providing a way of escape."
  }
];
