import { Component, computed, effect, signal } from '@angular/core';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
  company: {
    name: string;
  };
  address: {
    city: string;
  };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly userId = signal(1);
  readonly user = signal<User | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly name = computed(() => this.user()?.name ?? '');
  readonly email = computed(() => this.user()?.email ?? '');
  readonly phone = computed(() => this.user()?.phone ?? '');
  readonly initials = computed(() =>
    this.name()
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
  private readonly retryToken = signal(0);

  constructor() {
    effect((onCleanup) => {
      const id = this.userId();
      this.retryToken();
      const controller = new AbortController();

      this.isLoading.set(true);
      this.error.set(null);
      this.user.set(null);

      void fetch(`https://jsonplaceholder.typicode.com/users/${id}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error(`No user was found with ID ${id}.`);
            }
            throw new Error(`Could not load the user (HTTP ${response.status}).`);
          }
          return response.json() as Promise<User>;
        })
        .then((user) => {
          if (!controller.signal.aborted) {
            this.user.set(user);
          }
        })
        .catch((cause: unknown) => {
          if (!controller.signal.aborted) {
            this.error.set(
              cause instanceof TypeError
                ? 'Network error. Check your connection and try again.'
                : cause instanceof SyntaxError
                  ? 'The server returned invalid user data.'
                  : cause instanceof Error
                    ? cause.message
                    : 'Unable to load this user. Please try again.',
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            this.isLoading.set(false);
          }
        });

      onCleanup(() => controller.abort());
    });
  }

  onUserIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const id = input.valueAsNumber;

    if (!Number.isInteger(id) || id < 1) {
      this.user.set(null);
      this.isLoading.set(false);
      this.error.set('Enter a positive whole number for the user ID.');
      return;
    }

    if (id === this.userId()) {
      if (this.error()) {
        this.retry();
      }
      return;
    }

    this.userId.set(id);
  }

  retry(): void {
    this.retryToken.update((value) => value + 1);
  }
}