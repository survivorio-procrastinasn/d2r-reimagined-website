import areaLevelsJson from '../../wiki-data/area-levels.json';

interface IWikiPage { title: string; content: string; }

export class WikiAreaLevels {
  page = areaLevelsJson as IWikiPage;
}
