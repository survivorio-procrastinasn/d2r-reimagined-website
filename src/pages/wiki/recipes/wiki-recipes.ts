import { IRouter } from '@aurelia/router';
import { resolve } from 'aurelia';

const recipeList = [
  { slug: 'crafting', label: 'Crafting' },
  { slug: 'cube-recipes', label: 'Cube Recipes' },
  { slug: 'iscstat-limits', label: 'ISC Stat Limits' },
  { slug: 'item-enchants', label: 'Item Enchants' },
];

export class WikiRecipes {
  recipes = recipeList;
  private router: IRouter = resolve(IRouter);

  navigate(slug: string, event: Event) {
    event.preventDefault();
    this.router.load(`/recipes/${slug}`);
  }
}
