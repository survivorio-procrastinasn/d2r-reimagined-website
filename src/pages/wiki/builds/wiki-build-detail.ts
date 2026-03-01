import { IRouteableComponent, Parameters } from '@aurelia/router';
import buildsJson from '../../wiki-data/builds.json';

interface IBuildEntry { slug: string; title: string; content: string; }
interface IClassBuilds { index: { title: string; content: string } | null; builds: IBuildEntry[]; }

export class WikiBuildDetail implements IRouteableComponent {
  page: IBuildEntry | null = null;

  loading(params: Parameters) {
    const cls = params.class as string;
    const buildSlug = params.build as string;
    const classData = (buildsJson as Record<string, IClassBuilds>)[cls];
    if (classData) {
      this.page = classData.builds.find(b => b.slug === buildSlug) || null;
    }
  }
}
