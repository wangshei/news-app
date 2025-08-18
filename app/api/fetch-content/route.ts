import { NextRequest, NextResponse } from 'next/server';
import { load } from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('🔄 [fetch-content] Fetching content from:', url);
    
    // Fetch content from the external URL (server-side, no CORS issues)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log('❌ [fetch-content] HTTP error:', response.status);
      return NextResponse.json({ error: `HTTP ${response.status}` }, { status: response.status });
    }

    const htmlContent = await response.text();
    console.log('✅ [fetch-content] Content fetched, length:', htmlContent.length);

    // Try robust extraction using Cheerio
    const $ = load(htmlContent);

    const title = $('meta[property="og:title"]').attr('content')
      || $('title').text().trim()
      || '';
    const metaDescription = $('meta[name="description"]').attr('content')
      || $('meta[property="og:description"]').attr('content')
      || '';

    console.log('[fetch-content] Meta title:', title);
    console.log('[fetch-content] Meta description:', metaDescription);

    // BBC-specific selectors (since this is a BBC article)
    const bbcSelectors = [
      '.article-body__content',
      '[data-component="text-block"]',
      '.article-body',
      '.article__body',
      '.content__body',
      '.article-content',
      '.post-content',
      '.entry-content'
    ];

    // General selectors
    const generalSelectors = [
      'article',
      '[role="article"]',
      '.article-content',
      '.post-content',
      '.entry-content',
      '#content',
      '.content',
      '.news-content',
      '#article',
      '.article',
      '.bbt-html',
      '.bbt-content',
      '.rich_media_content',
      '#js_content'
    ];

    // Try BBC-specific selectors first
    let bestText = '';
    let bestSelector = '';

    for (const selector of bbcSelectors) {
      const node = $(selector);
      if (node && node.length > 0) {
        const text = node.text().replace(/\s+/g, ' ').trim();
        console.log(`[fetch-content] BBC Selector: ${selector}, length: ${text.length}`);
        if (text.length > bestText.length) {
          bestText = text;
          bestSelector = selector;
        }
      }
    }

    // If BBC selectors didn't work, try general selectors
    if (bestText.length < 100) {
      console.log('[fetch-content] BBC selectors insufficient, trying general selectors...');
      for (const selector of generalSelectors) {
        const node = $(selector);
        if (node && node.length > 0) {
          const text = node.text().replace(/\s+/g, ' ').trim();
          console.log(`[fetch-content] General Selector: ${selector}, length: ${text.length}`);
          if (text.length > bestText.length) {
            bestText = text;
            bestSelector = selector;
          }
        }
      }
    }

    // Fallback to full body text if candidates were empty
    if (bestText.length < 100) {
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
      console.log('[fetch-content] All selectors insufficient, bodyText length:', bodyText.length);
      if (bodyText.length > bestText.length) {
        bestText = bodyText;
        bestSelector = 'body';
      }
    }

    // As an additional fallback, use meta description if exists
    if (bestText.length < 60 && metaDescription) {
      console.log('[fetch-content] Using meta description fallback, length:', metaDescription.length);
      bestText = metaDescription.trim();
      bestSelector = 'meta:description';
    }

    // Last resort: try to extract text from paragraphs
    if (bestText.length < 100) {
      const paragraphs = $('p').map((i, el) => $(el).text().trim()).get();
      const paragraphText = paragraphs.join(' ').replace(/\s+/g, ' ').trim();
      console.log('[fetch-content] Paragraph extraction, length:', paragraphText.length);
      if (paragraphText.length > bestText.length) {
        bestText = paragraphText;
        bestSelector = 'paragraphs';
      }
    }

    // Final trim and clamp
    const maxLen = 4000;
    const content = bestText.substring(0, maxLen);

    console.log('🧹 [fetch-content] Final content length:', content.length, 'selectorUsed:', bestSelector);
    if (content.length > 0) {
      console.log('📝 [fetch-content] Content preview (first 300 chars):', content.substring(0, 300));
    } else {
      console.log('❌ [fetch-content] Extracted content is empty');
      console.log('❌ [fetch-content] Best text found was:', bestText.substring(0, 200));
      console.log('❌ [fetch-content] HTML structure analysis:');
      console.log('  - Has <body>:', htmlContent.includes('<body>'));
      console.log('  - Has <article>:', htmlContent.includes('<article>'));
      console.log('  - Has <p>:', htmlContent.includes('<p>'));
      console.log('  - Has <div>:', htmlContent.includes('<div>'));
    }

    return NextResponse.json({
      success: true,
      content,
      originalLength: htmlContent.length,
      cleanedLength: content.length,
      selectorUsed: bestSelector,
      title,
      metaDescription
    });

  } catch (error) {
    console.error('❌ [fetch-content] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch content',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
