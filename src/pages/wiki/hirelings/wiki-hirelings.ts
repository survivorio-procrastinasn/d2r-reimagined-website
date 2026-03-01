import hirelingsJson from '../../wiki-data/hirelings.json';

interface IWikiPage { title: string; content: string; }

export class WikiHirelings {
  page = hirelingsJson as IWikiPage;
}
