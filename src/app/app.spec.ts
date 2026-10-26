import { TestBed } from '@angular/core/testing';
import { App } from './app';

const sampleUser = {
  id: 1,
  name: 'Leanne Graham',
  username: 'Bret',
  email: 'leanne@example.com',
  phone: '1-770-736-8031',
  website: 'hildegard.org',
  company: { name: 'Romaguera-Crona' },
  address: { city: 'Gwenborough' },
};

describe('App', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://jsonplaceholder.typicode.com/users/1',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('shows loading while a user is being fetched', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="status"]')?.textContent).toContain(
      'Finding your signal',
    );
  });

  it('shows an error message when the request fails', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.isLoading.set(false);
    fixture.componentInstance.error.set('The user request failed (404).');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain(
      'The user request failed (404).',
    );
    expect(compiled.querySelector('.retry-button')?.textContent).toContain('Try again');
  });

  it('updates the user ID from the number input', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="number"]') as HTMLInputElement;

    input.value = '3';
    input.dispatchEvent(new Event('input'));

    expect(fixture.componentInstance.userId()).toBe(3);
  });

  it('shows a useful error when the API returns 404', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await vi.waitFor(() =>
      expect(fixture.componentInstance.error()).toBe('No user was found with ID 1.'),
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain(
      'No user was found with ID 1.',
    );
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('shows a network error when the request cannot reach the API', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await vi.waitFor(() =>
      expect(fixture.componentInstance.error()).toBe(
        'Network error. Check your connection and try again.',
      ),
    );
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain(
      'Network error. Check your connection and try again.',
    );
    expect(fixture.componentInstance.isLoading()).toBe(false);
  });

  it('renders the name, email, and phone from user signals', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.isLoading.set(false);
    fixture.componentInstance.user.set(sampleUser);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Leanne Graham');
    expect(compiled.querySelector('[href="mailto:leanne@example.com"]')?.textContent).toBe(
      'leanne@example.com',
    );
    expect(compiled.querySelector('[href="tel:1-770-736-8031"]')?.textContent).toBe(
      '1-770-736-8031',
    );
  });
});
