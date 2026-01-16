import React from 'react';
import { Sidebar } from "../components/Form";

export default function Ticket() {
  // 충전 상품 더미 데이터
  const ticketPackages = [
    { id: 1, amount: "10장", price: "1,000원", bonus: "0장", tag: null },
    { id: 2, amount: "30장", price: "3,000원", bonus: "3장", tag: "인기" },
    { id: 3, amount: "50장", price: "5,000원", bonus: "7장", tag: "추천" },
    { id: 4, amount: "100장", price: "10,000원", bonus: "20장", tag: "BEST" },
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] text-[#F1F5F9] overflow-hidden">
      {/* 1. 사이드바 유지 */}
      <Sidebar />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {/* 2. 헤더 영역 (Home과 동일한 구조) */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-[#1e293b]">
          <h1 className="text-xl font-black text-[#FB7185] tracking-tight">티켓 충전소</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#94A3B8]">보유 티켓: <strong className="text-[#F1F5F9] ml-1">42장</strong></span>
            <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center border border-[#334155]">
                <span className="text-[#FB7185] text-xs">🎫</span>
            </div>
          </div>
        </header>

        {/* 3. 섹션 영역 */}
        <section className="p-8 space-y-10 max-w-5xl mx-auto">
          
          {/* 보유 자산 요약 카드 (배너 스타일) */}
          <article className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#334155]/50 p-10 group">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#FB7185]/10 blur-[80px] rounded-full group-hover:bg-[#FB7185]/20 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <p className="text-[#94A3B8] font-bold text-sm uppercase tracking-widest">Available Balance</p>
                <h2 className="text-5xl font-black text-[#F1F5F9]">42 <span className="text-2xl text-[#FB7185]">Tickets</span></h2>
              </div>
              <div className="flex gap-4">
                <div className="bg-[#0f172a]/50 backdrop-blur-sm p-4 rounded-2xl border border-[#334155]">
                    <p className="text-[10px] text-[#94A3B8] mb-1">이번 달 사용</p>
                    <p className="text-lg font-bold">128장</p>
                </div>
                <div className="bg-[#0f172a]/50 backdrop-blur-sm p-4 rounded-2xl border border-[#334155]">
                    <p className="text-[10px] text-[#94A3B8] mb-1">소멸 예정</p>
                    <p className="text-lg font-bold text-rose-400">3장</p>
                </div>
              </div>
            </div>
          </article>

          {/* 티켓 충전 리스트 */}
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold border-l-4 border-[#FB7185] pl-4">티켓 번들 선택</h3>
              <p className="text-sm text-[#94A3B8]">결제 수단: Amuse Pay / 신용카드</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ticketPackages.map((pkg) => (
                <div 
                  key={pkg.id}
                  className="relative flex items-center justify-between p-6 bg-[#1e293b] rounded-3xl border border-[#1e293b] hover:border-[#FB7185]/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-[#0f172a] rounded-2xl flex items-center justify-center text-2xl border border-[#334155] group-hover:scale-110 transition-transform">
                      🎫
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-bold text-[#F1F5F9]">{pkg.amount}</h4>
                        {pkg.tag && (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-[#FB7185] text-[#0f172a] rounded-md">
                            {pkg.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#94A3B8]">+{pkg.bonus} 서비스 티켓 증정</p>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-[#334155] text-[#F1F5F9] font-bold rounded-xl group-hover:bg-[#FB7185] group-hover:text-[#0f172a] transition-all">
                    {pkg.price}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 안내 문구 */}
          <div className="bg-[#1e293b]/30 p-6 rounded-2xl border border-[#334155]/20">
             <ul className="text-xs text-[#94A3B8] space-y-2 list-disc pl-4">
                <li>충전된 티켓은 구매일로부터 5년간 유효합니다.</li>
                <li>이벤트로 지급된 서비스 티켓은 유효기간이 다를 수 있습니다.</li>
                <li>결제 취소는 사용하지 않은 티켓에 한해 7일 이내 가능합니다.</li>
             </ul>
          </div>
        </section>
      </main>
    </div>
  );
}