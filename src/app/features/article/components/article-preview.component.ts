import { Component, DestroyRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { Article } from '../models/article.model';
import { ArticleMetaComponent } from './article-meta.component';
import { RouterLink } from '@angular/router';
import { FavoriteButtonComponent } from './favorite-button.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MyMemoryTranslateResponse, TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-article-preview',
  template: `
    <div class="article-preview">
      <app-article-meta [article]="article">
        <app-favorite-button [article]="article" (toggle)="toggleFavorite($event)" class="pull-xs-right">
          {{ article.favoritesCount }}
        </app-favorite-button>
      </app-article-meta>

      <a [routerLink]="['/article', article.slug]" class="preview-link">
        <div class="d-flex align-items-center mb-2">
          <h1 class="mb-0">
            {{ translatedTitles[titleKey(article.slug)] || article.title }}
          </h1>

          <!-- Badge traduit -->
          @if (translatedTitles[titleKey(article.slug)] && !translatingTitles[titleKey(article.slug)]) {
            <span class="badge badge-success ml-2" title="Titre traduit">TRADUIT</span>
          }

          <!-- Indicateur de traduction en cours -->
          @if (translatingTitles[titleKey(article.slug)]) {
            <span class="ml-2 text-muted">...</span>
          }
        </div>

        <p>{{ article.description }}</p>
        <span>Read more...</span>

        <ul class="tag-list">
          @for (tag of article.tagList; track tag) {
            <li class="tag-default tag-pill tag-outline">
              {{ tag }}
            </li>
          }
        </ul>
      </a>
    </div>
  `,
  imports: [ArticleMetaComponent, FavoriteButtonComponent, RouterLink],
})
export class ArticlePreviewComponent implements OnChanges {
  @Input() article!: Article;
  @Input() titleLang: 'fr' | 'en' | 'es' | 'de' = 'en'; // la langue choisie pour la traduction
  @Input() translateTitle = false;

  private readonly destroyRef = inject(DestroyRef);
  private readonly translationService = inject(TranslationService);

  protected translatedTitles: Record<string, string> = {};
  protected translatingTitles: Record<string, boolean> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.article) return;

    if (!this.translateTitle) {
      return;
    }

    const articleChanged = !!changes['article'];
    const langChanged = !!changes['titleLang'];

    if (articleChanged || langChanged) {
      this.translateTitleInternal(this.article.slug, this.article.title);
    }
  }

  protected titleKey(articleSlug: string): string {
    return `${articleSlug}|${this.titleLang}`;
  }

  private translateTitleInternal(articleSlug: string, title: string): void {
    const key = this.titleKey(articleSlug);

    // 🚫 Ne jamais traduire si la langue choisie est la même que l'originale (ex: 'en')
    if (this.titleLang === 'en') {
      this.translatedTitles[key] = title;
      this.translatingTitles[key] = false;
      return;
    }

    if (this.translatedTitles[key] || this.translatingTitles[key]) {
      return;
    }

    this.translatingTitles[key] = true;

    this.translationService
      .translate(title, this.titleLang)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: MyMemoryTranslateResponse) => {
          this.translatedTitles[key] = res.responseData.translatedText;
          this.translatingTitles[key] = false;
        },
        error: () => {
          this.translatingTitles[key] = false;
        },
      });
  }

  toggleFavorite(favorited: boolean): void {
    this.article.favorited = favorited;

    if (favorited) {
      this.article.favoritesCount++;
    } else {
      this.article.favoritesCount--;
    }
  }
}
