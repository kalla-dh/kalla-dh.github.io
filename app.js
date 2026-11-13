/* Digital Haus · responsive storefront rebuild
   Standalone static storefront; Supabase admin is intentionally not connected yet.
   Source of truth for starting catalogue: shop-data.js.
*/
(() => {
  'use strict';
  const D = window.DH_DATA;
  if (!D) { document.getElementById('main-content').textContent='Catalogue data could not be loaded.'; return; }
  const designs=D.designs, tiers=D.tiers;
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pic=(id)=>`assets/${encodeURIComponent(id)}.webp`;
  const pound=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',minimumFractionDigits:0,maximumFractionDigits:0}).format(n);
  const tierSettings=(t,d)=>d?.tierOverrides?.[t.id]||{};
  const priceFor=(t,d)=>Object.prototype.hasOwnProperty.call(tierSettings(t,d),'price')?tierSettings(t,d).price:t.price;
  const goodPrice=(t,d)=>((tierSettings(t,d).active??t.active)!==false)&&priceFor(t,d)!==''&&priceFor(t,d)!==null&&Number.isFinite(Number(priceFor(t,d)))&&Number(priceFor(t,d))>0;
  const showPrice=(t,d)=>goodPrice(t,d)&&(tierSettings(t,d).showPrice??t.showPrice)!==false;
  const tname=id=>tiers.find(t=>t.id===id)||tiers[0];
  const dname=slug=>designs.find(d=>d.slug===slug);
  const productURL=(d,t)=>`#/product/${d.slug}/${t.id}`;
  const collURL=(o={})=>`#/collections${Object.keys(o).length?'?'+new URLSearchParams(o).toString():''}`;
  const designURL=d=>productURL(d,tiers[0]);
  const waLink=`https://wa.me/${D.settings.whatsapp}?text=${encodeURIComponent('Hello Digital Haus! I would love to know more about your wedding websites.')}`;
  const instagram=`https://www.instagram.com/${encodeURIComponent(D.settings.instagram)}/`;
  const icon={arrow:'↗',chevron:'→'};
  const searchSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="7.5"/><path d="m16.5 16.5 5 5"/></svg>';
  const menuSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  const whatsappSVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20.5l1.5-5a8.5 8.5 0 1 1 16-4z"/><path d="M8 8.3c.5-1 1.1-1 1.5 0 .4.9.8 1.5.5 1.9l-.6.8c.7 1.5 2.1 2.8 3.7 3.5l.9-.7c.4-.2 1.1.2 2 1 .5.5.2 1.1-.7 1.6-.8.5-2 .4-3.5-.4a11.2 11.2 0 0 1-3.4-2.8C6.4 10.5 7.6 8.9 8 8.3z"/></svg>';
  let catalogState={tier:'all',search:'',sort:'recommended',page:1};
  let lastRoute='';
  let cookieMemory=null;
  function cookieChoice(){try{return localStorage.getItem('dh_cookie_consent')||cookieMemory}catch(_){return cookieMemory}}
  function setCookieChoice(v){cookieMemory=v;try{localStorage.setItem('dh_cookie_consent',v)}catch(_){}renderCookies();if(v==='reject'&&pixelLoaded){location.reload();return}if(v==='accept')loadPixel()}
  let pixelLoaded=false;
  function loadPixel(){
    if(pixelLoaded||cookieChoice()!=='accept'||!D.settings.metaPixelEnabled||!/^\d{15,16}$/.test(String(D.settings.metaPixelId)))return;
    pixelLoaded=true;
    window.fbq=window.fbq||function(){(window.fbq.q=window.fbq.q||[]).push(arguments)};
    const sc=document.createElement('script');sc.async=true;sc.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(sc);
    window.fbq('init',String(D.settings.metaPixelId));window.fbq('track','PageView');
  }
  function track(name,meta){if(pixelLoaded&&typeof window.fbq==='function')window.fbq('track',name,meta||{})}
  function payhipURL(d,t){
    const code=d.codes[tiers.indexOf(t)];if(!code)return '';
    const u=new URL(`https://payhip.com/b/${code}`);
    const sources=new URLSearchParams(location.search);
    for(const [key,val] of sources)if(/^utm_(source|medium|campaign|content|term)$/.test(key))u.searchParams.set(key,val);
    return u.toString();
  }
  function header(active){
    const nav=[['Home','./index.html#/import'],['Collections','#/collections'],['About','#/about'],['How to Buy','#/how-to-buy'],['FAQs','#/faq'],['Contact','#/contact']];
    const navlinks=nav.map(([name,url])=>`<a href="${url}" class="${active===url?'active':''}" ${active===url?'aria-current="page"':''}>${name}</a>`).join('');
    $('#site-header').innerHTML=`<div class="announcement">✦ Beautiful templates for beautiful moments ✦</div><header class="header"><div class="container nav"><a href="./index.html#/import" class="logo" aria-label="Digital Haus home"><span>Digital</span><em>HAUS</em></a><nav class="nav-links" aria-label="Primary navigation">${navlinks}</nav><div class="nav-actions"><a class="btn btn-primary" href="#/collections">Explore designs <span class="arrow">↗</span></a><button id="nav-toggle" class="mobile-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open navigation">${menuSVG}</button></div></div><nav id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation">${navlinks}<a class="btn btn-primary" href="#/collections">Explore designs ↗</a></nav></header>`;
    $('#nav-toggle').addEventListener('click',()=>{const menu=$('#mobile-nav'),b=$('#nav-toggle');const on=menu.classList.toggle('open');b.setAttribute('aria-expanded',String(on));b.setAttribute('aria-label',on?'Close navigation':'Open navigation')});
    $('#mobile-nav').addEventListener('click',e=>{if(e.target.closest('a'))$('#mobile-nav').classList.remove('open')});
  }
  function footer(){
    $('#site-footer').innerHTML=`<footer class="footer"><div class="container"><div class="footer-grid"><div class="footer-about"><a href="./index.html#/import" class="logo">Digital <em>HAUS</em></a><p>Your love story, beautifully designed.</p><a class="btn btn-outline" style="border-color:#b98bac;color:#f8e7f0" href="#/contact">Let's get in touch ↗</a></div><div><h4>Explore</h4><a href="./index.html#/import">Home</a><a href="#/collections">Collections</a><a href="#/about">Our Story</a><a href="#/how-to-buy">How to Buy</a><a href="#/editing-service">Editing Service</a></div><div><h4>Help & Support</h4><a href="#/faq">FAQs</a><a href="#/contact">Contact Us</a><a href="${instagram}" target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href="${waLink}" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a></div><div><h4>Information</h4><a href="#/information">Purchase Guide</a><a href="#/terms">Terms & Conditions</a><a href="#/privacy">Privacy Policy</a><a href="#/refunds">Refund Policy</a><a href="#/cookie-settings" id="cookie-footer-link">Cookie choices</a></div></div><div class="footer-bottom"><p>© 2026 Digital Haus. All rights reserved.</p><p>Made with care for your most meaningful moments. &nbsp; · &nbsp; Prices in GBP (£)</p></div></div></footer>`;
  }
  function renderCookies(force=false){
    const decision=cookieChoice();
    if(decision&&!force){$('#cookie-root').innerHTML='';return;}
    $('#cookie-root').innerHTML=`<aside class="cookie-banner" role="dialog" aria-label="Cookie choices"><h3>Your privacy matters</h3><p>We use essential storage to remember your choice. Optional Meta Pixel tracking runs only if you accept and we have enabled it. Read our <a href="#/privacy" style="text-decoration:underline;color:var(--plum)">Privacy Policy</a>.</p><div class="cookie-actions"><button id="cookie-reject" class="btn btn-outline" type="button">Reject optional</button><button id="cookie-accept" class="btn btn-primary" type="button">Accept cookies</button></div></aside>`;
    $('#cookie-reject').addEventListener('click',()=>setCookieChoice('reject'));
    $('#cookie-accept').addEventListener('click',()=>setCookieChoice('accept'));
  }
  function sectionTitle(kicker,title,desc){return `<div class="section-heading"><div class="eyebrow">${esc(kicker)}</div><h2>${title}</h2><p>${esc(desc)}</p></div>`}
  function card(d,t,withTier=true){const price=showPrice(t,d)?`<div class="card-price">${pound(priceFor(t,d))}</div>`:!goodPrice(t,d)?`<div class="card-price"><small>Coming soon</small></div>`:'<div class="card-price"><small>Explore package</small></div>';
    return `<article class="design-card"><a href="${productURL(d,t)}" class="media" aria-label="View ${esc(d.name)} ${esc(t.name)} details"><img src="${pic(d.images[0])}" loading="lazy" alt="${esc(d.name)} wedding website design mockup"><span class="card-tier">${esc(t.name)}</span></a><div class="card-body"><div class="card-kicker">Collection ${esc(d.number)} · ${esc(d.category)}</div><h3><a href="${productURL(d,t)}">${esc(d.name)}</a></h3><p>${esc(d.summary)}</p><div class="card-footer">${price}<a href="${productURL(d,t)}" class="text-link" aria-label="Full details for ${esc(d.name)}, ${esc(t.name)}">Full details <span class="arrow">↗</span></a></div></div></article>`;
  }
  function packageCard(t){
    return `<article class="package-card ${t.featured?'featured':''}">${t.featured?'<span class="popular">Most popular</span>':''}<h3>${esc(t.name)}</h3><p class="package-subtitle">${esc(t.subtitle)}</p><div class="package-price">${showPrice(t)?`<span>£</span>${Number(t.price)}`:goodPrice(t)?'<span style="font-family:var(--sans);font-size:1rem">Explore benefits</span>':'<span style="font-family:var(--sans);font-size:1rem">Coming soon</span>'}</div><ul>${t.features.map(f=>`<li><span class="check">✓</span><span>${esc(f)}</span></li>`).join('')}</ul><a class="btn ${t.featured?'btn-primary':'btn-outline'}" href="${collURL({package:t.id})}">Explore ${esc(t.name)} designs ↗</a></article>`;
  }
  function home(){
    const [olive,emerald,crimson,velvet,blue,golden]=designs;
    return `<div class="hero"><div class="container hero-inner"><div class="hero-copy"><div class="eyebrow">✦ A little something lovely</div><h1>Beautiful moments, <i>beautifully</i> designed.</h1><p class="lede">Thoughtfully crafted digital wedding invitations, made to feel personal. Find a design that tells your love story — with a little touch of magic.</p><div class="hero-actions"><a class="btn btn-primary" href="#/collections">Explore the collection <span class="arrow">↗</span></a><a class="btn btn-outline" href="#/how-to-buy">How it works <span class="arrow">→</span></a></div><div class="hero-footnote">✿ &nbsp; Timeless details, a truly personal celebration.</div></div><div class="hero-visual"><span class="hero-flower" aria-hidden="true">Love,<br>always.</span><img class="hero-img-main" src="assets/editorial.webp" alt="Wedding stationery and Digital Haus invitation designs" fetchpriority="high"><img class="hero-img-float" src="assets/olive-story.webp" alt="Olive and Crimson digital invitation preview"></div></div></div>
    <section class="section"><div class="container">${sectionTitle('Discover your style','A design to fall in love with','From deeply romantic keepsakes to an understated classic, find the feeling that is entirely yours.')}<div class="category-grid"><a class="category-tile" href="${collURL({style:'Vintage & Romantic'})}"><img src="${pic(olive.images[1])}" loading="lazy" alt="Vintage and Romantic designs"><div><div class="eyebrow">01 / The collection</div><h3>Vintage & Romantic</h3><p>Delicate details, heartfelt charm. ↗</p></div></a><a class="category-tile" href="${collURL({style:'Moody & Elegant'})}"><img src="${pic(velvet.images[1])}" loading="lazy" alt="Moody and Elegant designs"><div><div class="eyebrow">02 / The collection</div><h3>Moody & Elegant</h3><p>For a statement kind of love. ↗</p></div></a><a class="category-tile" href="${collURL({style:'Timeless Classics'})}"><img src="${pic(golden.images[1])}" loading="lazy" alt="Timeless Classics designs"><div><div class="eyebrow">03 / The collection</div><h3>Timeless Classics</h3><p>Simple, personal, unforgettable. ↗</p></div></a></div></div></section>
    <section class="section featured"><div class="container">${sectionTitle('Our signature collection','The little details make the biggest memories.','A curated edit of designs to make your celebration feel unmistakably yours.')}<div class="featured-grid">${[olive,emerald,velvet].map(d=>card(d,tiers[0])).join('')}</div><div style="text-align:center;margin-top:34px"><a href="#/collections" class="btn btn-outline">View all designs <span class="arrow">↗</span></a></div></div></section>
    <section class="section" style="background:#fbf8f4"><div class="container home-difference"><div class="photo-wrap"><img src="${pic(crimson.images[1])}" loading="lazy" alt="Romantic Digital Haus wedding design detail"><div class="quote-stamp">Made for your one-of-a-kind story. ✿</div></div><div><div class="eyebrow">Welcome to Digital Haus</div><h2>A little more beautiful, by design.</h2><p class="lede">We create wedding website templates for the stories worth celebrating. From the first look to the final detail, our designs are made to feel like you.</p><ul class="mini-benefits"><li><span class="check">✓</span> Beautifully curated designs with a personal touch</li><li><span class="check">✓</span> Clear package options to suit your celebration</li><li><span class="check">✓</span> Website previews before you decide</li></ul><a href="#/about" class="text-link">Discover our story ↗</a></div></div></section>
    <section class="section packages-section" id="packages"><div class="container">${sectionTitle('The packages','Choose Your Experience','From a ready-to-edit template to full guest coordination, choose the level of support that suits your celebration.')}<div class="package-grid">${tiers.map(packageCard).join('')}</div><p class="pricing-note">All displayed prices are in GBP (£). Your Payhip checkout shows the amount charged.</p></div></section>
    <section class="section"><div class="container">${sectionTitle('How to buy','As easy as 1, 2, 3','From discovering the perfect design to sharing your wedding website with your favourite people.')}<div class="steps-grid"><div class="step"><span class="step-no">01</span><h3>Fall in love</h3><p>Browse the collections and preview a design that feels just like you.</p></div><div class="step"><span class="step-no">02</span><h3>Make it yours</h3><p>Choose your package, check out through Payhip and share the details we need.</p></div><div class="step"><span class="step-no">03</span><h3>Share the magic</h3><p>We personalise your website according to the package you have chosen.</p></div></div><div style="text-align:center;margin-top:35px"><a href="#/how-to-buy" class="btn btn-outline">Read the full guide ↗</a></div></div></section>
    <section class="section testimonials"><div class="container">${sectionTitle('Kind words','A little love from our couples','A few words from the people who have celebrated with Digital Haus.')}<div class="review-grid">${D.testimonials.filter(x=>x.visible).slice(0,3).map(reviewCard).join('')}</div></div></section>${cta()}`;
  }
  function reviewCard(x){return `<article class="review"><div class="stars" aria-label="Five star testimonial">★★★★★</div><blockquote>“${esc(x.quote)}”</blockquote><strong>${esc(x.name)}</strong></article>`}
  function cta(){return `<section class="section cta-band"><div class="container cta-inner"><div><div class="eyebrow">The vibe starts here</div><h2>Celebrate your story in style.</h2></div><a class="btn btn-light" href="#/collections">Shop the collection ↗</a></div></section>`}
  const allProducts=()=>tiers.flatMap(t=>designs.map(d=>({d,t})));
  function collection(){
    const hero=pageHero('Our signature designs','Collections','Thoughtfully created wedding websites that make every moment feel personal.');
    return `${hero}<section class="catalog-section"><div class="container"><div class="catalog-intro"><div><div class="eyebrow">The Digital Haus edit</div><h2>Explore the collections.</h2><p>30 possibilities. Six signature designs. Find yours.</p></div></div>${catalogState.style?`<p style="font-size:.82rem;color:var(--muted);margin:0 0 14px">Style: <strong>${esc(catalogState.style)}</strong> &nbsp;·&nbsp; <button class="btn-text" style="font-size:.8rem" type="button" id="clear-style">Show all styles ×</button></p>`:''}<div class="tier-chips" id="tier-chips" role="group" aria-label="Filter by package">${[['all','All'],...tiers.map(t=>[t.id,t.name])].map(([id,n])=>`<button class="chip" type="button" data-tier="${id}" aria-pressed="${catalogState.tier===id}">${n}</button>`).join('')}</div><div class="filters-panel"><div class="search-group"><label class="hidden-visually" for="design-search">Search designs</label><div class="input-wrap">${searchSVG}<input id="design-search" placeholder="Search designs, styles or packages…" type="search" autocomplete="off" value="${esc(catalogState.search)}"></div></div><div><label class="sort-label" for="catalog-sort">Sort by</label><select id="catalog-sort" class="sort-select"><option value="recommended">Recommended order</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Design name: A to Z</option></select></div></div><div class="result-meta" id="catalog-meta" aria-live="polite"></div><div id="catalog-results"></div><div id="catalog-pagination"></div></div></section>${cta()}`;
  }
  function filtered(){
    let a=allProducts();
    if(catalogState.tier!=='all')a=a.filter(x=>x.t.id===catalogState.tier);
    if(catalogState.style)a=a.filter(x=>x.d.category===catalogState.style);
    const q=catalogState.search.toLocaleLowerCase().trim();if(q)a=a.filter(({d,t})=>[d.name,d.summary,d.category,t.name,t.subtitle].join(' ').toLocaleLowerCase().includes(q));
    switch(catalogState.sort){case'price-low':a.sort((a,b)=>Number(priceFor(a.t,a.d))-Number(priceFor(b.t,b.d)));break;case'price-high':a.sort((a,b)=>Number(priceFor(b.t,b.d))-Number(priceFor(a.t,a.d)));break;case'name':a.sort((a,b)=>a.d.name.localeCompare(b.d.name)||tiers.indexOf(a.t)-tiers.indexOf(b.t));break;}
    return a;
  }
  function renderCatalogResults(){
    const list=filtered(),pages=Math.max(1,Math.ceil(list.length/10));catalogState.page=Math.min(Math.max(catalogState.page,1),pages);
    const start=(catalogState.page-1)*10;
    $('#catalog-meta').innerHTML=`<span>${list.length} ${list.length===1?'product':'products'} found</span><span>${list.length?'Showing '+(start+1)+'–'+Math.min(list.length,start+10)+' of '+list.length:'Try another search'}</span>`;
    $('#catalog-results').innerHTML=list.length?`<div class="catalog-grid">${list.slice(start,start+10).map(({d,t})=>card(d,t)).join('')}</div>`:`<div class="empty-result"><h3>Nothing found just yet.</h3><p class="muted">Try another search or browse all designs.</p><button type="button" id="clear-filters" class="btn btn-outline">Clear filters</button></div>`;
    if(!list.length)$('#clear-filters').addEventListener('click',()=>{catalogState={tier:'all',search:'',sort:'recommended',style:'',page:1};updateFilters()});
    let buttons='';for(let n=1;n<=pages;n++)buttons+=`<button class="page-btn ${n===catalogState.page?'active':''}" type="button" data-page="${n}" aria-label="Page ${n}" ${n===catalogState.page?'aria-current="page"':''}>${n}</button>`;
    $('#catalog-pagination').innerHTML=pages>1?`<nav class="pagination" aria-label="Catalogue pages"><button class="page-btn" type="button" data-page="${catalogState.page-1}" ${catalogState.page===1?'disabled':''}>← Previous</button>${buttons}<button class="page-btn" type="button" data-page="${catalogState.page+1}" ${catalogState.page===pages?'disabled':''}>Next →</button></nav>`:'';
    $$('#catalog-pagination .page-btn').forEach(b=>b.addEventListener('click',()=>{catalogState.page=Number(b.dataset.page);renderCatalogResults();$('#tier-chips').scrollIntoView({behavior:'smooth',block:'start'})}));
    $('#tier-chips').querySelectorAll('.chip').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tier===catalogState.tier)));
  }
  function $$(s){return Array.from(document.querySelectorAll(s))}
  function updateFilters(){
    $('#design-search').value=catalogState.search;$('#catalog-sort').value=catalogState.sort;renderCatalogResults();
  }
  function bindCollection(){
    $('#clear-style')?.addEventListener('click',()=>{catalogState.style='';catalogState.page=1;$('#clear-style').parentElement.remove();renderCatalogResults()});
    $$('#tier-chips .chip').forEach(b=>b.addEventListener('click',()=>{catalogState.tier=b.dataset.tier;catalogState.page=1;renderCatalogResults()}));
    $('#design-search').addEventListener('input',e=>{catalogState.search=e.target.value;catalogState.page=1;renderCatalogResults()});
    $('#catalog-sort').addEventListener('change',e=>{catalogState.sort=e.target.value;catalogState.page=1;renderCatalogResults()});
    $('#catalog-sort').value=catalogState.sort;renderCatalogResults();
  }
  function product(d,t){
    const okay=goodPrice(t,d);const cash=showPrice(t,d)?`<div class="product-price">${pound(priceFor(t,d))}<small>One-time payment in GBP</small></div>`:okay?'<span class="badge">Price shown at checkout</span>':'<span class="badge">Coming soon</span>';
    const buy=okay?`<a class="btn btn-primary" id="buy-link" href="${esc(payhipURL(d,t))}" target="_blank" rel="noopener noreferrer">Buy this ${esc(t.name)} package ↗</a>`:'<button class="btn btn-primary" disabled>Coming soon</button>';
    return `<section class="product-section"><div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="./index.html#/import">Home</a><span>›</span><a href="#/collections">Collections</a><span>›</span><span>${esc(d.name)}</span></nav><div class="product-grid"><div class="product-media"><img class="product-main-image" id="product-main-image" src="${pic(d.images[0])}" alt="${esc(d.name)} website preview"><div class="gallery-thumbs" role="group" aria-label="Choose product image">${d.images.map((img,i)=>`<button type="button" class="thumb ${i===0?'active':''}" data-image="${pic(img)}" aria-label="Show image ${i+1}" aria-pressed="${i===0}"><img src="${pic(img)}" loading="lazy" alt="${esc(d.name)} gallery thumbnail ${i+1}"></button>`).join('')}</div></div><div class="product-info"><div class="eyebrow">Collection ${esc(d.number)} / ${esc(d.category)}</div><h1>${esc(d.name)}</h1><p class="product-summary">${esc(d.tagline)}</p><span class="badge">Digital wedding website</span><hr class="product-divider"><label class="product-label">Choose your package</label><div class="tier-select">${tiers.map(tier=>`<a href="${productURL(d,tier)}" aria-current="${tier.id===t.id}">${esc(tier.name)}</a>`).join('')}</div><div class="product-buybox"><div class="buyrow">${cash}<span class="muted" style="font-size:.75rem">${esc(t.subtitle)}</span></div><div class="buybuttons">${buy}<a class="btn btn-outline" id="preview-link" href="https://atelier-dh.github.io/${encodeURIComponent(d.folder)}/" target="_blank" rel="noopener noreferrer">Preview design ↗</a></div><div class="trust-notes"><span>✓ Payhip secure checkout</span><span>✓ Digital delivery</span><span>✓ Preview before purchase</span></div></div><div class="product-inclusions"><h3>What's included · ${esc(t.name)}</h3><ul>${t.features.map(f=>`<li><span class="check">✓</span>${esc(f)}</li>`).join('')}</ul></div><p class="muted" style="font-size:.72rem;margin-top:18px">Please review the specific package inclusions before purchasing. Payment is processed by Payhip.</p></div></div></div></section><section class="product-story"><div class="container product-story-layout"><div><div class="eyebrow">A closer look</div><h2>About this template</h2><p>${esc(d.description)}</p></div><div><div class="eyebrow">Thoughtful details</div><h2>What makes it special</h2><ul class="special-list">${d.special.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div></section><section class="section related-section"><div class="container">${sectionTitle('You might also love','Explore a little more','A few more carefully considered designs for your special day.')}<div class="related-grid">${designs.filter(x=>x.id!==d.id).slice(0,3).map(x=>card(x,t)).join('')}</div></div></section>`;
  }
  function bindProduct(d,t){
    $$('.thumb').forEach(b=>b.addEventListener('click',()=>{$('#product-main-image').src=b.dataset.image;$$('.thumb').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))})}));
    $('#preview-link')?.addEventListener('click',()=>track('ViewContent',{content_name:d.name,content_category:t.name}));
    $('#buy-link')?.addEventListener('click',()=>track('InitiateCheckout',{content_name:d.name,content_category:t.name,currency:'GBP',value:Number(priceFor(t,d))}));
  }
  function pageHero(eyebrow,title,desc){return `<header class="page-hero"><div class="container"><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(desc)}</p></div></header>`}
  function about(){return `${pageHero('Our story','About Digital Haus','A home for beautiful ideas and unforgettable moments.')}<section class="interior"><div class="container"><div class="about-layout"><img src="assets/editorial2.webp" alt="Beautiful burgundy wedding stationery" loading="lazy"><div><div class="eyebrow">✿ Hello, we are Digital Haus</div><h2>Thoughtful design for beautiful moments.</h2><p class="lede">Every meaningful occasion deserves a space of its own. We design wedding websites and invitations that marry timeless details with personality and warmth.</p><p class="muted">Our collections bring together romantic typography, considered palettes and expressive little details. Choose a look that feels like you, then select the level of support your celebration needs.</p><a class="btn btn-primary" href="#/collections">Discover the collection ↗</a></div></div></div></section>${cta()}`}
  const howSteps=[['Explore templates','Browse our collection and find a design you love.'],['Choose your package','Select Template, Basic, Standard, Premium or Advanced according to the included benefits.'],['Complete payment','Click Buy and check out securely through Payhip.'],['Get your PDF guide','Your purchase PDF provides instructions for the next steps.'],['Submit your details','Share your names, wedding date, venue and any other information required for the chosen package.'],['We bring it to life','For personalised services, production usually takes around seven days after complete details are received, subject to your order terms.'],['Your website is ready','Review your completed wedding website and share it with your favourite people.']];
  function howToBuy(){return `${pageHero('The Digital Haus experience','How to Buy','From your favourite invitation template to your finished wedding website, in a few easy steps.')}<section class="interior"><div class="container content-narrow"><div class="eyebrow">The step-by-step guide</div>${howSteps.map((x,i)=>`<div class="editorial-step"><span class="number">${String(i+1).padStart(2,'0')}</span><div><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div></div>`).join('')}<div class="notice" style="margin-top:28px">Production schedules and revision allowances depend on the package purchased. Your Payhip product details and confirmed order terms take precedence.</div><div style="margin-top:29px"><a class="btn btn-primary" href="#/collections">Explore our templates ↗</a></div></div></section>`}
  const faqGroups=[['About the templates',[
    ['What exactly am I buying?','A digital wedding website template or a related personalised service, according to the package you choose. Check the product page for the complete inclusions.'],
    ['Can I preview a design before buying?','Yes. Open a design in Collections and select Preview design to view its live example before checking out.'],
    ['Can I personalise the template?','The options depend on your package. Template customers can edit their Canva design; personalised packages include the particular changes described in their benefits.'],
    ['Can I change the colours, fonts or layout?','Design and layout changes are not automatically included in personalised services. Choose a design that already feels like you, and review the selected package description.']]],
    ['Ordering & payment',[
    ['How do I buy?','Choose a design and package, then select Buy. Your checkout opens on Payhip, which processes the payment.'],
    ['Which currency do you use?','Prices are listed in British pounds (GBP). Your final payment amount is shown by Payhip.'],
    ['What happens after checkout?','Follow the instructions and information supplied with your Payhip digital download or confirmation.'],
    ['What if I need to change my order?','Contact us as soon as possible with the Payhip order reference. Any changes depend on the order status and applicable terms.']]],
    ['Personalisation & support',[
    ['How long does personalisation take?','The guide anticipates around seven days after complete details have been received. Confirmed delivery terms on your order take precedence.'],
    ['Are revisions included?','Some packages include content revision rounds. The precise allowance is listed with each package.'],
    ['How do I get help?','Contact us through the WhatsApp or Instagram links on the Contact page and include your order reference if you have purchased.']]]];
  function faq(){return `${pageHero('Customer support','Frequently Asked Questions','Everything you need to know about our templates, checkout, personalisation and support.')}<section class="interior"><div class="container content-narrow"><div class="faq-list">${faqGroups.map(([group,items])=>`<div class="faq-group">${esc(group)}</div>${items.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}`).join('')}</div><div class="editorial-panel" style="margin-top:48px;text-align:center"><h2>Still have a question?</h2><p>We're happy to help you find the right way forward.</p><p style="margin-top:24px"><a class="btn btn-primary" href="#/contact">Contact Digital Haus ↗</a></p></div></div></section>`}
  function contact(){return `${pageHero('We would love to hear from you','Contact Us','Questions about a design, an order or an editing service? We’re here to help.')}<section class="interior"><div class="container content-narrow"><div class="contact-card"><div><h3>Chat with us on WhatsApp</h3><p>For product enquiries, order support and help choosing a package.</p></div><a class="btn btn-primary" href="${waLink}" target="_blank" rel="noopener noreferrer">Open WhatsApp ↗</a></div><div class="contact-card"><div><h3>Find us on Instagram</h3><p>Follow @${esc(D.settings.instagram)} for designs and inspiration.</p></div><a class="btn btn-outline" href="${instagram}" target="_blank" rel="noopener noreferrer">Visit Instagram ↗</a></div>${D.settings.email?`<div class="contact-card"><div><h3>Email support</h3><p>${esc(D.settings.email)}</p></div><a class="btn btn-outline" href="mailto:${esc(D.settings.email)}">Send an email ↗</a></div>`:''}<div class="notice" style="margin-top:25px">Already placed an order? Please include your Payhip order reference and the name of your chosen design so we can help more quickly.</div></div></section>`}
  function editing(){return `${pageHero('For the finishing touches','Template Editing Service','Love the design but want us to handle the personal touches?')}<section class="interior"><div class="container content-medium"><div class="editorial-grid"><div class="editorial-panel"><div class="eyebrow">01 / Design</div><h3>Choose your starting point</h3><p>Choose one of our wedding website designs as the foundation for your invitation.</p></div><div class="editorial-panel"><div class="eyebrow">02 / Content</div><h3>Make it personal</h3><p>Share the names, photos, event schedule and wording you would like us to add.</p></div><div class="editorial-panel"><div class="eyebrow">03 / Review</div><h3>Review the little details</h3><p>Content revisions are available according to the package you purchase.</p></div><div class="editorial-panel"><div class="eyebrow">04 / Delivery</div><h3>Ready for your guests</h3><p>Your wedding website is delivered on the schedule confirmed for your order.</p></div></div><div class="editorial-panel" style="margin-top:20px"><h2>What we'll need</h2><p>Couple's names, wedding date, ceremony and reception details, venue information, photos and any additional content required for your chosen design.</p></div><a class="btn btn-primary" href="#/collections">Choose your design ↗</a></div></section>`}
  function information(){return `${pageHero('Digital Haus / Your guide','Information','A few helpful details about purchasing, personalising and receiving your wedding invitation website.')}<section class="interior"><div class="container content-medium"><div class="editorial-grid"><div class="editorial-panel"><div class="eyebrow">Before purchasing</div><h3>Choose a template</h3><p>Browse the designs, preview your favourite and check the complete inclusions of your chosen package.</p><p style="margin-top:19px"><a class="text-link" href="#/collections">Explore collections ↗</a></p></div><div class="editorial-panel"><div class="eyebrow">After checkout</div><h3>Get your guide</h3><p>Follow the instructions supplied with your Payhip purchase to submit your wedding information.</p><p style="margin-top:19px"><a class="text-link" href="#/how-to-buy">How to buy ↗</a></p></div><div class="editorial-panel"><div class="eyebrow">Our services</div><h3>Personalisation & editing</h3><p>Package-specific content editing and revision allowances are displayed on each product page.</p><p style="margin-top:19px"><a class="text-link" href="#/editing-service">Editing service ↗</a></p></div><div class="editorial-panel"><div class="eyebrow">Customer care</div><h3>Contact & support</h3><p>Keep your order confirmation and payment reference for enquiries about your purchase.</p><p style="margin-top:19px"><a class="text-link" href="#/contact">Contact us ↗</a></p></div></div></div></section>`}
  const policies={
    terms:{title:'Terms & Conditions',subtitle:'Please review these terms before buying.',parts:[
      ['General information','These terms govern the use of Digital Haus digital products and related services. Review the applicable Payhip listing and package description before placing an order.'],
      ['Products and services','Digital Haus offers wedding website templates and, where selected, content personalisation and related services. Features, formats, delivery requirements and usage rights vary by package.'],
      ['Payment and fulfilment','Checkout and payment processing take place on Payhip. Digital purchases are supplied electronically. Any personalisation work starts after the complete required information has been received.'],
      ['Intellectual property','All designs, creative material and branding remain the property of their respective rights holders. Your purchase grants usage rights as specified by the applicable product listing. Resale or redistribution is not authorised unless expressly permitted.'],
      ['Personalisation and revisions','Editing is limited to the chosen package. Customers are responsible for the accuracy of names, times, venues, photographs and other materials submitted. Revision allowances are described in the package inclusions.'],
      ['Consumer rights','Nothing in these terms excludes any statutory consumer rights that cannot legally be excluded.'],
      ['Questions','For any issue with your order, contact Digital Haus via the channels provided on our Contact page with your Payhip order reference.']]},
    privacy:{title:'Privacy Policy',subtitle:'Your trust and information matter to us.',parts:[
      ['Information we may receive','Depending on the selected service, we may receive contact information, Payhip order references, event details sent for personalisation and messages sent through our support channels.'],
      ['How it is used','We use information to fulfil orders, provide services, respond to enquiries and maintain necessary business records.'],
      ['Third-party services','Payhip processes checkout transactions. Our hosting provider and the support channels you choose may process data in line with their own privacy notices.'],
      ['Cookies and analytics','Essential browser storage remembers your cookie choice. Optional Meta Pixel tracking is only loaded after you accept optional cookies and tracking has been enabled in website settings.'],
      ['Data retention and requests','We retain information as necessary for our services and legal obligations. Contact us to ask about information that you have provided, subject to applicable law.'],
      ['Security','We take reasonable precautions to protect information, while recognising that no electronic service is risk-free.']]},
    refunds:{title:'Refund Policy',subtitle:'Transparent expectations for digital purchases.',parts:[
      ['Digital products','Templates are delivered digitally. Please review the previews, selected package, product description and download format carefully before purchasing.'],
      ['Editing services','If you wish to cancel a personalised service, contact support promptly. Available options can depend on work already completed and the terms shown at checkout.'],
      ['Incorrect or missing deliverables','If a delivered item is incomplete, missing or materially incorrect, contact support with your order details so we can review and help resolve the issue.'],
      ['Change of mind and consumer rights','Refund eligibility depends on the applicable order terms and mandatory consumer protections. Nothing here removes rights that apply by law.'],
      ['How to contact us','Provide your Payhip reference, the product purchased and a short explanation of the issue. Relevant screenshots can help our support team.']]}
  };
  function policy(type){const p=policies[type];return `${pageHero('Digital Haus / Policies',p.title,p.subtitle)}<section class="interior"><div class="container content-narrow"><a class="return-link" href="#/information">← Back to information</a><article class="policy-article">${p.parts.map(([h,b])=>`<section><h2>${esc(h)}</h2><p>${esc(b)}</p></section>`).join('')}</article></div></section>`}
  function notfound(){return `${pageHero('Digital Haus','Page not found','The page you were looking for is no longer here.')}<section class="section center"><a href="#/collections" class="btn btn-primary">Browse designs ↗</a></section>`}
  const aliases={'/import':'/','/import-2':'/about','/import-3':'/collections','/import-4':'/contact','/import-5':'/editing-service','/import-6':'/faq','/import-7':'/how-to-buy','/import-8':'/information','/import-9':'/privacy','/import-14':'/refunds','/import-15':'/terms'};
  function route(){
    const raw=(location.hash.slice(1)||'/');const [pathRaw,qRaw='']=raw.split('?');
    if(pathRaw==='/'||pathRaw==='/import'||pathRaw===''){location.replace('./index.html#/import');return;}
    let path=(window.DH_LEGACY_ROUTES&&window.DH_LEGACY_ROUTES[pathRaw.replace(/^\//,'')])||aliases[pathRaw]||pathRaw;
    if(path.startsWith('/import-10'))path='/product/the-crimson-lace/basic';
    else if(path.startsWith('/import-11'))path='/product/the-emerald-memory/basic';
    else if(path.startsWith('/import-12'))path='/product/the-olive-and-crimson/basic';
    else if(path.startsWith('/import-13'))path='/product/the-velvet-affair/basic';
    const q=new URLSearchParams(qRaw);
    const active=path.startsWith('/product/')?'#/collections':path==='/'?'#/':`#${path}`;
    header(active);footer();renderCookies();loadPixel();
    let body='',bind=null,title='Digital Haus — Beautifully designed wedding websites';
    if(path==='/')body=home();
    else if(path==='/collections'){
      catalogState={tier:tiers.some(t=>t.id===q.get('package'))?q.get('package'):'all',search:q.get('search')||'',sort:['recommended','price-low','price-high','name'].includes(q.get('sort'))?q.get('sort'):'recommended',style:q.get('style')||'',page:Math.max(1,Number(q.get('page'))||1)};
      body=collection();bind=bindCollection;title='Collections | Digital Haus';
    } else if(path.startsWith('/product/')){
      const [, , slug, tierid]=path.split('/');const d=dname(slug),t=tiers.find(t=>t.id===tierid)||tiers[0];
      if(d){body=product(d,t);bind=()=>bindProduct(d,t);title=`${d.name} — ${t.name} | Digital Haus`;}else body=notfound();
    }else{
      const other={'/about':['About',about],'/how-to-buy':['How to Buy',howToBuy],'/faq':['FAQs',faq],'/contact':['Contact',contact],'/editing-service':['Editing Service',editing],'/information':['Information',information],'/terms':['Terms & Conditions',()=>policy('terms')],'/privacy':['Privacy Policy',()=>policy('privacy')],'/refunds':['Refund Policy',()=>policy('refunds')],'/cookie-settings':['Cookie choices',()=>`${pageHero('Your privacy','Cookie choices','Choose whether optional website tracking is allowed.')}<section class="interior center"><button class="btn btn-outline" id="change-cookies">Update cookie preferences</button></section>`]};
      if(other[path]){title=other[path][0]+' | Digital Haus';body=other[path][1]()}else body=notfound();
    }
    $('#main-content').innerHTML=body;document.title=title;
    if(bind)bind();
    $('#change-cookies')?.addEventListener('click',()=>renderCookies(true));
    if(lastRoute!==raw){window.scrollTo(0,0);lastRoute=raw;track('PageView')}
  }
  window.addEventListener('hashchange',route);
  route();
})();
