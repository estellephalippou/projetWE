import { Component, DestroyRef, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArticlesService } from '../services/articles.service';
import { ArticleListConfig } from '../models/article-list-config.model';
import { Article } from '../models/article.model';
import { ArticlePreviewComponent } from './article-preview.component';
import { NgClass } from '@angular/common';
import { LoadingState } from '../../../core/models/loading-state.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-article-list',
  template: `
    <div>
      <label>{{ titleLabel }}</label>
      <select [(ngModel)]="titleLang" class="form-control form-control-sm">
        <option value="fr">FR</option>
        <option value="en">EN</option>
        <option value="es">ES</option>
        <option value="de">DE</option>
      </select>
    </div>

    @if (loading === LoadingState.LOADING) {
      <div class="article-preview">Loading articles...</div>
    }

    @if (loading === LoadingState.LOADED) {
      @for (article of results; track article.slug) {
        <app-article-preview [article]="article" [titleLang]="titleLang" [translateTitle]="titleLang !== 'en'" />
      } @empty {
        <div class="article-preview">No articles are here... yet.</div>
      }

      <nav>
        <ul class="pagination">
          @for (pageNumber of totalPages; track pageNumber) {
            <li class="page-item" [ngClass]="{ active: pageNumber === currentPage }">
              <button class="page-link" (click)="setPageTo(pageNumber)">
                {{ pageNumber }}
              </button>
            </li>
          }
        </ul>
      </nav>
    }
  `,
  imports: [FormsModule, ArticlePreviewComponent, NgClass],
  styles: `
    .page-link {
      cursor: pointer;
    }
  `,
})
export class ArticleListComponent {
  query!: ArticleListConfig;
  results: Article[] = [];
  currentPage = 1;
  totalPages: Array<number> = [];
  loading = LoadingState.NOT_LOADED;
  LoadingState = LoadingState;
  destroyRef = inject(DestroyRef);

  titleLang: 'fr' | 'en' | 'es' | 'de' = 'en';

  get titleLabel(): string {
    switch (this.titleLang) {
      case 'en':
        return 'Title language:';
      case 'es':
        return 'Idioma del título:';
      case 'de':
        return 'Titelsprache:';
      case 'fr':
      default:
        return 'Langue des titres :';
    }
  }

  @Input() limit!: number;
  @Input()
  set config(config: ArticleListConfig) {
    if (config) {
      this.query = config;
      this.currentPage = 1;
      this.runQuery();
    }
  }

  constructor(private articlesService: ArticlesService) {}

  setPageTo(pageNumber: number) {
    this.currentPage = pageNumber;
    this.runQuery();
  }

  runQuery() {
    this.loading = LoadingState.LOADING;
    this.results = [];

    if (this.limit) {
      this.query.filters.limit = this.limit;
      this.query.filters.offset = this.limit * (this.currentPage - 1);
    }

    this.articlesService
      .query(this.query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.loading = LoadingState.LOADED;
        this.results = data.articles;
        this.totalPages = Array.from(new Array(Math.ceil(data.articlesCount / this.limit)), (val, index) => index + 1);
      });
  }
}
