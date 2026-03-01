import classChangesJson from '../../wiki-data/class-changes.json';

interface IWikiPage { title: string; content: string; }

const classLinks = [
  { slug: 'amazon', label: 'Amazon' },
  { slug: 'assassin', label: 'Assassin' },
  { slug: 'barbarian', label: 'Barbarian' },
  { slug: 'druid', label: 'Druid' },
  { slug: 'necromancer', label: 'Necromancer' },
  { slug: 'paladin', label: 'Paladin' },
  { slug: 'sorceress', label: 'Sorceress' },
];

export class WikiClasses {
  classChanges = classChangesJson as IWikiPage | null;
  classLinks = classLinks;
}
