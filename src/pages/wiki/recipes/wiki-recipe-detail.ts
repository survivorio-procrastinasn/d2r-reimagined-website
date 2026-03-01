import { IRouteableComponent, Parameters } from '@aurelia/router';
import recipesJson from '../../wiki-data/recipes.json';

interface IWikiPage { title: string; content: string; }

export class WikiRecipeDetail implements IRouteableComponent {
  page: IWikiPage | null = null;

  loading(params: Parameters) {
    const slug = params.recipe as string;
    this.page = (recipesJson as Record<string, IWikiPage>)[slug] || null;
  }
}
