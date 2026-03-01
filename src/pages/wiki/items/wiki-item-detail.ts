import { IRouteableComponent, Parameters } from '@aurelia/router';
import itemsJson from '../../wiki-data/items.json';

interface IWikiPage { title: string; content: string; }

export class WikiItemDetail implements IRouteableComponent {
  page: IWikiPage | null = null;

  loading(params: Parameters) {
    const slug = params.item as string;
    this.page = (itemsJson as Record<string, IWikiPage>)[slug] || null;
  }
}
