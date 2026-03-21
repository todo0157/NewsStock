import { NextRequest, NextResponse } from 'next/server';

// 한국투자증권 API - 보유종목 조회
export async function POST(req: NextRequest) {
  const { appKey, appSecret, accountNo } = await req.json();

  if (!appKey || !appSecret || !accountNo) {
    return NextResponse.json({ error: 'API Key, Secret, 계좌번호를 모두 입력해주세요.' }, { status: 400 });
  }

  try {
    // 1. 접근 토큰 발급
    const tokenRes = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: appKey,
        appsecret: appSecret,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.json({ error: 'API 인증에 실패했습니다. Key와 Secret을 확인해주세요.' }, { status: 401 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. 보유종목 조회
    const [acctPrefix, acctSuffix] = accountNo.split('-');
    const balanceRes = await fetch(
      `https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/trading/inquire-balance?CANO=${acctPrefix}&ACNT_PRDT_CD=${acctSuffix}&AFHR_FLPR_YN=N&OFL_YN=&INQR_DVSN=02&UNPR_DVSN=01&FUND_STTL_ICLD_YN=N&FNCG_AMT_AUTO_RDPT_YN=N&PRCS_DVSN=01&CTX_AREA_FK100=&CTX_AREA_NK100=`,
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          authorization: `Bearer ${accessToken}`,
          appkey: appKey,
          appsecret: appSecret,
          tr_id: 'TTTC8434R',
        },
      }
    );

    if (!balanceRes.ok) {
      return NextResponse.json({ error: '보유종목 조회에 실패했습니다.' }, { status: 500 });
    }

    const balanceData = await balanceRes.json();
    const output1 = balanceData.output1 || [];

    const stocks = output1
      .filter((item: Record<string, string>) => Number(item.hldg_qty) > 0)
      .map((item: Record<string, string>) => ({
        name: item.prdt_name,
        symbol: item.pdno,
        quantity: Number(item.hldg_qty),
        avgPrice: Number(item.pchs_avg_pric),
        market: 'KR',
      }));

    return NextResponse.json({ stocks });
  } catch {
    return NextResponse.json({ error: '한국투자증권 API 연동 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
