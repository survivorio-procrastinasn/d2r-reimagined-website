import { IRouteableComponent, Parameters } from '@aurelia/router';
import classesJson from '../../wiki-data/classes.json';

interface IWikiPage { title: string; content: string; }

export class WikiClassDetail implements IRouteableComponent {
  page: IWikiPage | null = null;
  className: string = '';

  loading(params: Parameters) {
    const slug = params.class as string;
    this.className = slug;
    const classes = classesJson as Record<string, IWikiPage>;
    this.page = classes[slug] || null;
  }
}
