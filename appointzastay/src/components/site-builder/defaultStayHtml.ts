/** Crisp default Stay HTML template (keep in sync with StayDefaultHtmlTemplate.cs). */
export const DEFAULT_STAY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{organisation.name}}</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
--gold:#c9a96e;--gold-light:#e8d5a8;--gold-dark:#a88b4a;
--ink:#1a1a1a;--ink-soft:#3d3d3d;--muted:#6b6b6b;
--cream:#faf8f5;--white:#ffffff;--border:#e8e4dc;
--shadow:0 4px 24px rgba(0,0,0,.08);--shadow-lg:0 12px 40px rgba(0,0,0,.12);
--radius:12px;--radius-sm:8px;--max:1120px;
--font:'Georgia',serif;--sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif
}
html{scroll-behavior:smooth}
body{font-family:var(--sans);color:var(--ink);background:var(--cream);line-height:1.6;-webkit-font-smoothing:antialiased}
img,video{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}
a[href=""]{display:none}
img[src=""]{display:none}
video:not([src]),video[src=""],iframe:not([src]),iframe[src=""]{display:none}
.container{width:100%;max-width:var(--max);margin:0 auto;padding:0 1.25rem}
.section{padding:4rem 0}
.section-title{font-family:var(--font);font-size:clamp(1.75rem,4vw,2.5rem);font-weight:400;letter-spacing:.02em;color:var(--ink);margin-bottom:.5rem;text-align:center}
.section-sub{text-align:center;color:var(--muted);font-size:.95rem;margin-bottom:2.5rem;max-width:540px;margin-left:auto;margin-right:auto}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.85rem 1.75rem;background:var(--gold);color:var(--white);font-size:.875rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;border:none;border-radius:var(--radius-sm);cursor:pointer;transition:background .2s,transform .15s;box-shadow:0 2px 8px rgba(201,169,110,.3)}
.btn:hover{background:var(--gold-dark);transform:translateY(-1px)}
.btn-outline{background:transparent;color:var(--gold);border:1.5px solid var(--gold);box-shadow:none}
.btn-outline:hover{background:var(--gold);color:var(--white)}
.btn-sm{padding:.65rem 1.25rem;font-size:.8rem}
.status-badge{display:inline-block;padding:.3rem .75rem;font-size:.75rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;border-radius:4px;background:#f0ece4;color:var(--muted)}
.status-available{background:#e8f5e9;color:#2e7d32}
.status-unavailable{background:#fce8e6;color:#c62828}
#rooms:has(.rooms-grid:empty),
#amenities:has(.amenities-grid:empty),
#gallery:has(.gallery-grid:empty),
#packages:has(.packages-grid:empty),
#reviews:has(.reviews-grid:empty),
#nearby:has(.nearby-grid:empty),
#activities:has(.activities-grid:empty),
#faq:has(.faq-list:empty){display:none}

/* Header */
.header{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:.75rem 0}
.header-inner{display:flex;align-items:center;justify-content:space-between;gap:1rem}
.logo-wrap{display:flex;align-items:center;gap:.75rem}
.logo-wrap img{height:42px;width:auto;object-fit:contain}
.logo-text{font-family:var(--font);font-size:1.25rem;font-weight:400;letter-spacing:.03em;color:var(--ink)}
.nav{display:none;gap:1.5rem;align-items:center}
.nav a{font-size:.8rem;font-weight:500;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-soft);transition:color .2s}
.nav a:hover{color:var(--gold)}
.header-cta{display:none}
@media(min-width:768px){
.nav{display:flex}
.header-cta{display:inline-flex}
}

/* Hero */
.hero{position:relative;min-height:70vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1a1a 0%,#2d2a26 50%,#1a1a1a 100%);color:var(--white);text-align:center;padding:5rem 1.25rem 4rem;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 30% 40%,rgba(201,169,110,.15) 0%,transparent 60%),radial-gradient(ellipse at 70% 60%,rgba(201,169,110,.08) 0%,transparent 50%);pointer-events:none}
.hero-content{position:relative;z-index:1;max-width:680px}
.hero-tagline{font-size:.8rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--gold-light);margin-bottom:1rem}
.hero-tagline:empty{display:none}
.hero h1{font-family:var(--font);font-size:clamp(2.25rem,6vw,3.75rem);font-weight:400;line-height:1.15;letter-spacing:.02em;margin-bottom:1.25rem}
.hero-desc{font-size:1.05rem;color:rgba(255,255,255,.75);margin-bottom:2rem;line-height:1.7;max-width:520px;margin-left:auto;margin-right:auto}
.hero-desc:empty{display:none}
.hero-actions{display:flex;flex-wrap:wrap;gap:1rem;justify-content:center}
.hero .btn{background:var(--gold);color:var(--white)}
.hero .btn-outline{border-color:rgba(255,255,255,.4);color:var(--white)}
.hero .btn-outline:hover{background:rgba(255,255,255,.1);border-color:var(--white)}
.unavailable-msg{display:inline-block;padding:.85rem 1.75rem;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:var(--radius-sm);font-size:.875rem;color:rgba(255,255,255,.7);letter-spacing:.04em}

/* About */
.about-grid{display:grid;gap:2.5rem;align-items:center}
@media(min-width:768px){.about-grid{grid-template-columns:1fr 1fr;gap:3.5rem}}
.about-text h2{font-family:var(--font);font-size:clamp(1.5rem,3.5vw,2.15rem);font-weight:400;margin-bottom:1rem;text-align:left}
.about-text p{color:var(--ink-soft);margin-bottom:1rem;line-height:1.75}
.about-text p:empty{display:none}
.about-meta{display:flex;flex-wrap:wrap;gap:1.5rem;margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border)}
.about-meta-item{font-size:.85rem;color:var(--muted)}
.about-meta-item strong{display:block;color:var(--ink);font-weight:600;font-size:.9rem;margin-bottom:.15rem}
.map-wrap{border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);aspect-ratio:4/3;background:var(--border)}
.map-wrap iframe{width:100%;height:100%;border:0}

/* Rooms */
.rooms-grid{display:grid;gap:1.75rem;grid-template-columns:1fr}
@media(min-width:600px){.rooms-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:900px){.rooms-grid{grid-template-columns:repeat(3,1fr)}}
.room-card{background:var(--white);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s}
.room-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.room-card-media{position:relative;aspect-ratio:4/3;overflow:hidden;background:#e8e4dc}
.room-card-media img{width:100%;height:100%;object-fit:cover}
.room-card-media video{width:100%;height:100%;object-fit:cover;aspect-ratio:16/9}
.room-card-body{padding:1.35rem;display:flex;flex-direction:column;flex:1;gap:.5rem}
.room-card-body h3{font-family:var(--font);font-size:1.2rem;font-weight:400}
.room-meta{font-size:.85rem;color:var(--muted)}
.room-price{font-size:1.1rem;font-weight:600;color:var(--ink);margin-top:.25rem}
.room-price span{font-size:.8rem;font-weight:400;color:var(--muted)}
.room-card-footer{margin-top:auto;padding-top:.75rem;display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap}

/* Amenities */
.amenities-grid{display:grid;gap:1.25rem;grid-template-columns:1fr 1fr}
@media(min-width:600px){.amenities-grid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:900px){.amenities-grid{grid-template-columns:repeat(4,1fr)}}
.amenity-card{background:var(--white);border-radius:var(--radius-sm);padding:1.35rem;box-shadow:var(--shadow);text-align:center;transition:transform .2s}
.amenity-card:hover{transform:translateY(-2px)}
.amenity-icon{font-size:1.75rem;margin-bottom:.65rem;line-height:1}
.amenity-icon:empty{display:none}
.amenity-card h3{font-size:.95rem;font-weight:600;margin-bottom:.35rem;color:var(--ink)}
.amenity-card p{font-size:.8rem;color:var(--muted);line-height:1.5}
.amenity-card p:empty{display:none}

/* Gallery */
.gallery-grid{display:grid;gap:1rem;grid-template-columns:1fr 1fr}
@media(min-width:600px){.gallery-grid{grid-template-columns:repeat(3,1fr)}}
@media(min-width:900px){.gallery-grid{grid-template-columns:repeat(4,1fr)}}
.gallery-item{position:relative;border-radius:var(--radius-sm);overflow:hidden;aspect-ratio:1;background:#e8e4dc;box-shadow:var(--shadow)}
.gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .35s}
.gallery-item:hover img{transform:scale(1.05)}
.gallery-item video,.gallery-item iframe{width:100%;height:100%;object-fit:cover;aspect-ratio:16/9}
.gallery-label{position:absolute;bottom:0;left:0;right:0;padding:.5rem .75rem;background:linear-gradient(transparent,rgba(0,0,0,.65));color:var(--white);font-size:.75rem;font-weight:500;letter-spacing:.03em}
.gallery-label:empty{display:none}

/* Packages */
.packages-grid{display:grid;gap:1.75rem;grid-template-columns:1fr}
@media(min-width:700px){.packages-grid{grid-template-columns:repeat(2,1fr)}}
.package-card{background:var(--white);border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column;position:relative}
.package-badge{position:absolute;top:1rem;left:1rem;z-index:2;background:var(--gold);color:var(--white);font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:.35rem .75rem;border-radius:4px}
.package-badge:empty{display:none}
.package-media{aspect-ratio:16/9;overflow:hidden;background:#e8e4dc}
.package-media img{width:100%;height:100%;object-fit:cover}
.package-body{padding:1.5rem;display:flex;flex-direction:column;flex:1;gap:.5rem}
.package-body h3{font-family:var(--font);font-size:1.25rem;font-weight:400}
.package-price{font-size:1.35rem;font-weight:700;color:var(--gold-dark)}
.package-desc{font-size:.9rem;color:var(--ink-soft);line-height:1.6}
.package-desc:empty{display:none}
.package-details{font-size:.8rem;color:var(--muted);display:flex;flex-wrap:wrap;gap:.75rem;margin-top:.25rem}
.package-includes{font-size:.85rem;color:var(--ink-soft);margin-top:.5rem;line-height:1.6}
.package-includes:empty{display:none}
.package-footer{margin-top:auto;padding-top:1rem}

/* Reviews */
.reviews-grid{display:grid;gap:1.5rem;grid-template-columns:1fr}
@media(min-width:700px){.reviews-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1000px){.reviews-grid{grid-template-columns:repeat(3,1fr)}}
.review-card{background:var(--white);border-radius:var(--radius);padding:1.75rem;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:.75rem}
.review-stars{color:var(--gold);font-size:1rem;letter-spacing:.1em}
.review-quote{font-family:var(--font);font-size:1.05rem;line-height:1.65;color:var(--ink-soft);flex:1;font-style:italic}
.review-author{font-size:.85rem;font-weight:600;color:var(--ink)}
.review-date{font-size:.75rem;color:var(--muted)}
.review-date:empty{display:none}

/* Nearby */
.nearby-grid{display:grid;gap:1.25rem;grid-template-columns:1fr}
@media(min-width:600px){.nearby-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:900px){.nearby-grid{grid-template-columns:repeat(3,1fr)}}
.nearby-card{background:var(--white);border-radius:var(--radius-sm);overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column}
.nearby-media{aspect-ratio:16/10;overflow:hidden;background:#e8e4dc}
.nearby-media img{width:100%;height:100%;object-fit:cover}
.nearby-body{padding:1.15rem;display:flex;flex-direction:column;gap:.35rem;flex:1}
.nearby-body h3{font-size:1rem;font-weight:600}
.nearby-meta{font-size:.8rem;color:var(--muted);display:flex;gap:1rem;flex-wrap:wrap}
.nearby-icon{font-size:1.25rem}
.nearby-icon:empty{display:none}

/* Activities */
.activities-grid{display:grid;gap:1.25rem;grid-template-columns:1fr}
@media(min-width:600px){.activities-grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:900px){.activities-grid{grid-template-columns:repeat(3,1fr)}}
.activity-card{background:var(--white);border-radius:var(--radius-sm);padding:1.5rem;box-shadow:var(--shadow);display:flex;gap:1rem;align-items:flex-start}
.activity-icon{font-size:1.75rem;line-height:1;flex-shrink:0}
.activity-icon:empty{display:none}
.activity-card h3{font-size:1rem;font-weight:600;margin-bottom:.35rem}
.activity-card p{font-size:.85rem;color:var(--muted);line-height:1.55}
.activity-card p:empty{display:none}

/* FAQ */
.faq-list{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:1rem}
.faq-item{background:var(--white);border-radius:var(--radius-sm);padding:1.35rem 1.5rem;box-shadow:var(--shadow)}
.faq-item h3{font-size:1rem;font-weight:600;margin-bottom:.5rem;color:var(--ink)}
.faq-item p{font-size:.9rem;color:var(--ink-soft);line-height:1.65}

/* Contact */
.contact-grid{display:grid;gap:2rem}
@media(min-width:700px){.contact-grid{grid-template-columns:1fr 1fr;gap:3rem}}
.contact-info{display:flex;flex-direction:column;gap:1.25rem}
.contact-row{display:flex;gap:.85rem;align-items:flex-start}
.contact-row-icon{width:40px;height:40px;border-radius:50%;background:rgba(201,169,110,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem;color:var(--gold-dark)}
.contact-row strong{display:block;font-size:.8rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-bottom:.15rem}
.contact-row span,.contact-row a{font-size:.95rem;color:var(--ink);word-break:break-word}
.contact-row a:hover{color:var(--gold)}
.policy-box{background:var(--white);border-radius:var(--radius);padding:1.5rem;box-shadow:var(--shadow)}
.policy-box h3{font-family:var(--font);font-size:1.15rem;margin-bottom:.75rem}
.policy-box p{font-size:.875rem;color:var(--ink-soft);line-height:1.65;margin-bottom:.75rem}
.policy-box p:last-child{margin-bottom:0}

/* Footer */
.footer{background:var(--ink);color:rgba(255,255,255,.7);padding:3rem 0 2rem}
.footer-inner{display:flex;flex-direction:column;gap:2rem;align-items:center;text-align:center}
.footer-brand{font-family:var(--font);font-size:1.35rem;color:var(--white);letter-spacing:.03em}
.footer-links{display:flex;flex-wrap:wrap;gap:1.25rem;justify-content:center}
.footer-links a{font-size:.8rem;letter-spacing:.04em;text-transform:uppercase;color:rgba(255,255,255,.55);transition:color .2s}
.footer-links a:hover{color:var(--gold-light)}
.footer-copy{font-size:.8rem;color:rgba(255,255,255,.4);margin-top:.5rem}
.footer-contact{font-size:.85rem;line-height:1.7}
.footer-contact a{color:rgba(255,255,255,.7)}
.footer-contact a:hover{color:var(--gold-light)}
</style>
</head>
<body>

<header class="header">
<div class="container header-inner">
<div class="logo-wrap">
<img src="{{organisation.logo_url}}" alt="{{organisation.name}}">
<span class="logo-text">{{organisation.name}}</span>
</div>
<nav class="nav">
<a href="#about">About</a>
<a href="#rooms">Rooms</a>
<a href="#amenities">Amenities</a>
<a href="#gallery">Gallery</a>
<a href="#packages">Packages</a>
<a href="#reviews">Reviews</a>
<a href="#contact">Contact</a>
</nav>
{{#if_has_bookable_rooms}}
<a href="{{BOOK_URL}}" target="_top" class="btn btn-sm header-cta">Book now</a>
{{/if_has_bookable_rooms}}
</div>
</header>

<section class="hero">
<div class="hero-content">
<p class="hero-tagline">{{organisation.tagline}}</p>
<h1>{{organisation.name}}</h1>
<p class="hero-desc">{{organisation.description}}</p>
<div class="hero-actions">
{{#if_has_bookable_rooms}}
<a href="{{BOOK_URL}}" target="_top" class="btn">Book now</a>
{{/if_has_bookable_rooms}}
{{#if_no_bookable_rooms}}
<span class="unavailable-msg">No rooms available right now</span>
{{/if_no_bookable_rooms}}
<a href="#rooms" class="btn btn-outline">View rooms</a>
</div>
</div>
</section>

<section class="section" id="about">
<div class="container">
<div class="about-grid">
<div class="about-text">
<h2>About {{organisation.name}}</h2>
<p>{{organisation.description}}</p>
<div class="about-meta">
<div class="about-meta-item">
<strong>Check-in</strong>
{{organisation.check_in_time}}
</div>
<div class="about-meta-item">
<strong>Check-out</strong>
{{organisation.check_out_time}}
</div>
<div class="about-meta-item">
<strong>Location</strong>
{{organisation.city}}, {{organisation.state}}
</div>
</div>
</div>
<div class="map-wrap">
<iframe title="{{organisation.name}} map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen
src="https://www.google.com/maps?q={{organisation.address}},{{organisation.city}},{{organisation.state}},{{organisation.country}}&output=embed"></iframe>
</div>
</div>
</div>
</section>

<section class="section" id="rooms">
<div class="container">
<h2 class="section-title">Rooms</h2>
<p class="section-sub">Choose from our carefully appointed accommodations</p>
<div class="rooms-grid">
{{#rooms}}
<article class="room-card">
<div class="room-card-media">
<img src="{{room.main_photo}}" alt="{{room.name}}">
<video controls playsinline preload="metadata" src="{{room.video_url}}"></video>
</div>
<div class="room-card-body">
<h3>{{room.name}}</h3>
<p class="room-meta">{{room.type}} Â· {{room.capacity}} guests</p>
<p class="room-price">From â‚¹{{room.price}} <span>/ night</span></p>
<div class="room-card-footer">
{{#if_room_available}}
<a href="{{ROOM_BOOK_URL}}" target="_top" class="btn btn-sm">Book this room</a>
{{/if_room_available}}
{{#if_room_unavailable}}
<span class="status-badge status-unavailable">{{room.status_label}}</span>
{{/if_room_unavailable}}
</div>
</div>
</article>
{{/rooms}}
</div>
</div>
</section>

<section class="section" id="amenities">
<div class="container">
<h2 class="section-title">Amenities</h2>
<p class="section-sub">Thoughtful details for a memorable stay</p>
<div class="amenities-grid">
{{#amenities}}
<div class="amenity-card">
<div class="amenity-icon">{{amenity.icon}}</div>
<h3>{{amenity.name}}</h3>
<p>{{amenity.description}}</p>
</div>
{{/amenities}}
</div>
</div>
</section>

<section class="section" id="gallery">
<div class="container">
<h2 class="section-title">Gallery</h2>
<p class="section-sub">A glimpse into your stay</p>
<div class="gallery-grid">
{{#gallery}}
<div class="gallery-item">
<img src="{{image.url}}" alt="{{image.label}}">
<video controls playsinline preload="metadata" src="{{image.video_url}}"></video>
<span class="gallery-label">{{image.label}}</span>
</div>
{{/gallery}}
</div>
</div>
</section>

<section class="section" id="packages">
<div class="container">
<h2 class="section-title">Packages</h2>
<p class="section-sub">Curated experiences for every occasion</p>
<div class="packages-grid">
{{#packages}}
<article class="package-card">
<span class="package-badge">{{package.badge}}</span>
<div class="package-media">
<img src="{{package.image_url}}" alt="{{package.name}}">
</div>
<div class="package-body">
<h3>{{package.name}}</h3>
<p class="package-price">â‚¹{{package.price}}</p>
<p class="package-desc">{{package.description}}</p>
<div class="package-details">
<span>{{package.minimum_nights}} nights min</span>
<span>Up to {{package.max_guests}} guests</span>
<span>{{package.room_type}}</span>
</div>
<p class="package-includes">{{package.includes}}</p>
<div class="package-footer">
<a href="{{PACKAGE_BOOK_URL}}" target="_top" class="btn btn-sm">Book package</a>
</div>
</div>
</article>
{{/packages}}
</div>
</div>
</section>

<section class="section" id="reviews">
<div class="container">
<h2 class="section-title">Guest Reviews</h2>
<p class="section-sub">What our guests are saying</p>
<div class="reviews-grid">
{{#reviews}}
<article class="review-card">
<div class="review-stars">{{review.rating}}</div>
<p class="review-quote">"{{review.quote}}"</p>
<p class="review-author">{{review.author}}</p>
<p class="review-date">{{review.date}}</p>
</article>
{{/reviews}}
</div>
</div>
</section>

<section class="section" id="nearby">
<div class="container">
<h2 class="section-title">Nearby Places</h2>
<p class="section-sub">Explore the surroundings</p>
<div class="nearby-grid">
{{#nearby_places}}
<article class="nearby-card">
<div class="nearby-media">
<img src="{{place.image_url}}" alt="{{place.name}}">
</div>
<div class="nearby-body">
<span class="nearby-icon">{{place.icon}}</span>
<h3>{{place.name}}</h3>
<div class="nearby-meta">
<span>{{place.distance}}</span>
<span>{{place.travel_time}}</span>
</div>
</div>
</article>
{{/nearby_places}}
</div>
</div>
</section>

<section class="section" id="activities">
<div class="container">
<h2 class="section-title">Activities</h2>
<p class="section-sub">Make the most of your stay</p>
<div class="activities-grid">
{{#activities}}
<article class="activity-card">
<span class="activity-icon">{{activity.icon}}</span>
<div>
<h3>{{activity.title}}</h3>
<p>{{activity.description}}</p>
</div>
</article>
{{/activities}}
</div>
</div>
</section>

<section class="section" id="faq">
<div class="container">
<h2 class="section-title">Frequently Asked Questions</h2>
<p class="section-sub">Everything you need to know</p>
<div class="faq-list">
{{#faq}}
<div class="faq-item">
<h3>{{faq.question}}</h3>
<p>{{faq.answer}}</p>
</div>
{{/faq}}
</div>
</div>
</section>

<section class="section" id="contact">
<div class="container">
<h2 class="section-title">Contact Us</h2>
<p class="section-sub">We would love to hear from you</p>
<div class="contact-grid">
<div class="contact-info">
<div class="contact-row">
<div class="contact-row-icon">ðŸ“</div>
<div>
<strong>Address</strong>
<span>{{organisation.address}}, {{organisation.city}}, {{organisation.state}}, {{organisation.country}}</span>
</div>
</div>
<div class="contact-row">
<div class="contact-row-icon">ðŸ“ž</div>
<div>
<strong>Phone</strong>
<a href="tel:{{organisation.phone}}">{{organisation.phone}}</a>
</div>
</div>
<div class="contact-row">
<div class="contact-row-icon">ðŸ’¬</div>
<div>
<strong>WhatsApp</strong>
<a href="https://wa.me/{{organisation.whatsapp}}">{{organisation.whatsapp}}</a>
</div>
</div>
<div class="contact-row">
<div class="contact-row-icon">âœ‰ï¸</div>
<div>
<strong>Email</strong>
<a href="mailto:{{organisation.email}}">{{organisation.email}}</a>
</div>
</div>
</div>
<div class="policy-box">
<h3>Policies</h3>
<p><strong>Cancellation:</strong> {{organisation.cancellation_policy}}</p>
<p><strong>Payment:</strong> {{organisation.payment_policy}}</p>
</div>
</div>
</div>
</section>

<footer class="footer">
<div class="container footer-inner">
<div class="footer-brand">{{organisation.name}}</div>
<div class="footer-contact">
{{organisation.address}}, {{organisation.city}}, {{organisation.state}}<br>
<a href="tel:{{organisation.phone}}">{{organisation.phone}}</a> Â· <a href="mailto:{{organisation.email}}">{{organisation.email}}</a>
</div>
<nav class="footer-links">
<a href="#about">About</a>
<a href="#rooms">Rooms</a>
<a href="#gallery">Gallery</a>
<a href="#packages">Packages</a>
<a href="#contact">Contact</a>
</nav>
<p class="footer-copy">&copy; {{currentyear}} {{organisation.name}}. All rights reserved.</p>
</div>
</footer>

</body>
</html>
`;
