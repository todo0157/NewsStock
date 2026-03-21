import { NextRequest, NextResponse } from 'next/server';

// 스크린샷 AI 분석 - 보유종목 추출
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('screenshot') as File | null;

  if (!file) {
    return NextResponse.json({ error: '스크린샷을 업로드해주세요.' }, { status: 400 });
  }

  // 이미지를 base64로 변환
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const mimeType = file.type || 'image/png';

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // API 키가 없으면 데모 데이터 반환
    return NextResponse.json({
      stocks: [
        { name: '삼성전자', symbol: '005930', quantity: 10, avgPrice: 72000, market: 'KR' },
        { name: 'SK하이닉스', symbol: '000660', quantity: 5, avgPrice: 185000, market: 'KR' },
      ],
      message: 'API 키 미설정 - 데모 데이터입니다. ANTHROPIC_API_KEY를 설정하면 실제 분석이 가능합니다.',
    });
  }

  try {
    // Claude API로 이미지 분석
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64,
                },
              },
              {
                type: 'text',
                text: `이 스크린샷은 증권 앱의 보유종목 화면입니다. 보유 종목 정보를 추출해주세요.

반드시 아래 JSON 형식으로만 답변해주세요. 다른 텍스트는 포함하지 마세요.

[
  {
    "name": "종목명",
    "symbol": "종목코드",
    "quantity": 보유수량(숫자),
    "avgPrice": 평균매입가(숫자),
    "market": "KR" 또는 "US"
  }
]

종목코드를 알 수 없으면 "-"로, 수량이나 가격을 알 수 없으면 0으로 입력하세요.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'AI 분석에 실패했습니다.' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';

    // JSON 파싱
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: '종목 정보를 인식할 수 없습니다. 다른 스크린샷을 시도해주세요.' }, { status: 400 });
    }

    const stocks = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ stocks });
  } catch {
    return NextResponse.json({ error: '스크린샷 분석 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
