import buildsJson from '../../wiki-data/builds.json';

interface IBuildEntry { slug: string; title: string; content: string; }
interface IClassBuilds { index: { title: string; content: string } | null; builds: IBuildEntry[]; }

const classOrder = ['amazon', 'assassin', 'barbarian', 'druid', 'necromancer', 'paladin', 'sorceress'];

export class WikiBuilds {
  classes = classOrder.map(cls => ({
    slug: cls,
    label: cls.charAt(0).toUpperCase() + cls.slice(1),
    builds: ((buildsJson as Record<string, IClassBuilds>)[cls]?.builds || []),
  }));
}
