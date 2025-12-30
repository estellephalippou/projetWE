import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsyncPipe, NgClass } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { combineLatest, throwError } from 'rxjs';
import { User } from '../../../../core/auth/user.model';
import { UserService } from '../../../../core/auth/services/user.service';
import { IfAuthenticatedDirective } from '../../../../core/auth/if-authenticated.directive';
import { Article } from '../../models/article.model';
import { Comment } from '../../models/comment.model';
import { Profile } from '../../../profile/models/profile.model';
import { Errors } from '../../../../core/models/errors.model';
import { ArticlesService } from '../../services/articles.service';
import { CommentsService } from '../../services/comments.service';
import { ArticleMetaComponent } from '../../components/article-meta.component';
import { ArticleCommentComponent } from '../../components/article-comment.component';
import { FavoriteButtonComponent } from '../../components/favorite-button.component';
import { FollowButtonComponent } from '../../../profile/components/follow-button.component';
import { MarkdownPipe } from '../../../../shared/pipes/markdown.pipe';
import { ListErrorsComponent } from '../../../../shared/components/list-errors.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-article-page',
  templateUrl: './article.component.html',
  imports: [
    ArticleMetaComponent,
    RouterLink,
    NgClass,
    FollowButtonComponent,
    FavoriteButtonComponent,
    MarkdownPipe,
    AsyncPipe,
    ListErrorsComponent,
    FormsModule,
    ArticleCommentComponent,
    ReactiveFormsModule,
    IfAuthenticatedDirective,
  ],
})
export default class ArticleComponent implements OnInit {
  article!: Article;
  comments: Comment[] = [];
  currentUser!: User | null;
  canModify = false;

  commentControl = new FormControl<string>('', { nonNullable: true });
  commentFormErrors: Errors | null = null;
  isSubmitting = false;
  isDeleting = false;

  selectedLang = 'fr';
  translatedBody = '';
  isTranslating = false;

  destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly articleService: ArticlesService,
    private readonly commentsService: CommentsService,
    private readonly userService: UserService,
    private readonly translationService: TranslationService,
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.params['slug'];

    combineLatest([this.articleService.get(slug), this.commentsService.getAll(slug), this.userService.currentUser])
      .pipe(
        catchError(err => {
          void this.router.navigate(['/']);
          return throwError(() => err);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([article, comments, currentUser]) => {
        this.article = article;
        this.comments = comments;
        this.currentUser = currentUser;
        this.canModify = currentUser?.username === article.author.username;
      });
  }

  translateArticle(): void {
    if (!this.article?.body) return;

    this.isTranslating = true;
    this.isTranslating = true;
    this.translatedBody = '';

    const paragraphs = this.article.body.split('\n\n');

    const translateSequentially = async () => {
      for (const paragraph of paragraphs) {
        try {
          const res: any = await this.translationService.translate(paragraph, this.selectedLang).toPromise();
          this.translatedBody += res.responseData.translatedText + '\n\n';
        } catch (err) {
          console.error('Erreur traduction :', err);
        }
      }
      this.isTranslating = false;
    };

    translateSequentially();
  }

  onToggleFavorite(favorited: boolean): void {
    this.article.favorited = favorited;
    this.article.favoritesCount += favorited ? 1 : -1;
  }

  toggleFollowing(profile: Profile): void {
    this.article.author.following = profile.following;
  }

  deleteArticle(): void {
    this.isDeleting = true;

    this.articleService
      .delete(this.article.slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        void this.router.navigate(['/']);
      });
  }

  addComment(): void {
    this.isSubmitting = true;
    this.commentFormErrors = null;

    this.commentsService
      .add(this.article.slug, this.commentControl.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: comment => {
          this.comments.unshift(comment);
          this.commentControl.reset('');
          this.isSubmitting = false;
        },
        error: errors => {
          this.isSubmitting = false;
          this.commentFormErrors = errors;
        },
      });
  }

  deleteComment(comment: Comment): void {
    this.commentsService
      .delete(comment.id, this.article.slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.comments = this.comments.filter(item => item !== comment);
      });
  }
}
