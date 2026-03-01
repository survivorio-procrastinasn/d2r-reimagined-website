import { IRouter } from '@aurelia/router';
import { resolve } from 'aurelia';

const itemList = [
  { slug: 'gems', label: 'Gems' },
  { slug: 'orbs', label: 'Orbs' },
  { slug: 'potions', label: 'Potions' },
  { slug: 'keys', label: 'Keys' },
  { slug: 'charms', label: 'Charms' },
  { slug: 'runes', label: 'Runes' },
  { slug: 'loottable', label: 'Loot Table' },
];

export class WikiItems {
  items = itemList;
  private router: IRouter = resolve(IRouter);

  navigate(slug: string, event: Event) {
    event.preventDefault();
    this.router.load(`/wiki-items/${slug}`);
  }
}
