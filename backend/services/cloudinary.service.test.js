const crypto = require('crypto');
jest.mock('fs', () => ({ promises: { readFile: jest.fn() } }));
const fs = require('fs').promises;
const { uploadScanPdf } = require('./cloudinary.service');

describe('course scan PDF storage', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const file = { path: '/tmp/scan.pdf', originalname: 'Chapter 1.pdf' };

  beforeEach(() => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    fs.readFile.mockResolvedValue(Buffer.from('%PDF-test'));
    global.fetch = jest.fn();
  });
  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  test('uploads the original PDF with signed credentials and returns durable references', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ secure_url: 'https://res.cloudinary.com/test/raw/upload/chapter.pdf', public_id: 'course-scans/chapter.pdf' }) });
    const result = await uploadScanPdf(file);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.cloudinary.com/v1_1/test-cloud/raw/upload');
    const form = options.body;
    expect(form.get('public_id')).toMatch(/^course-scans\/.+\.pdf$/);
    expect(form.get('signature')).toBe(crypto.createHash('sha256').update(`public_id=${form.get('public_id')}&timestamp=${form.get('timestamp')}test-secret`).digest('hex'));
    expect(form.get('file').name).toBe('Chapter 1.pdf');
    expect(await form.get('file').text()).toBe('%PDF-test');
    expect(form.get('api_secret')).toBeNull();
    expect(result.cloudinaryPublicId).toBe('course-scans/chapter.pdf');
    expect(result.fileUrl).toMatch(/^https:/);
  });

  test('fails before reading the PDF when credentials are missing', async () => {
    delete process.env.CLOUDINARY_API_SECRET;
    await expect(uploadScanPdf(file)).rejects.toThrow('are required');
    expect(fs.readFile).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('propagates Cloudinary upload failures', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: { message: 'Invalid signature' } }) });
    await expect(uploadScanPdf(file)).rejects.toThrow('Cloudinary PDF upload failed: Invalid signature');
  });
});
