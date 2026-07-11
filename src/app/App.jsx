import { useState, useMemo, useRef, useEffect } from "react";
import productsData from "../data/products.json";
import { Search, ShoppingCart, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X } from "lucide-react";
import { toast, Toaster } from "sonner";

const TAX_RATE = 0.13;

const ART_TYPES = ["poster", "print", "painting", "keychain"];
const SIZES = ["a5", "a4", "a3", "8x10", "11x17", "2.5in"];

const EMPTY_PERSON = { firstName: "", lastName: "", email: "", phone: "", street: "", city: "", country: "", postalCode: "" };
const EMPTY_PAYMENT = { nameOnCard: "", cardNumber: "", expiry: "", cvv: "" };

const PRODUCTS = productsData.products;

function formatPrice(n) {
  return `$${n.toFixed(2)}`;
}

function validatePerson(data) {
  const errs = {};
  if (!data.firstName.trim()) errs.firstName = "First name is required.";
  if (!data.lastName.trim()) errs.lastName = "Last name is required.";
  if (!data.email.trim()) {
    errs.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errs.email = "Please enter a valid email address.";
  }
  if (!data.phone.trim()) errs.phone = "Phone number is required.";
  if (!data.street.trim()) errs.street = "Street address is required.";
  if (!data.city.trim()) errs.city = "City is required.";
  if (!data.country.trim()) errs.country = "Country is required.";
  if (!data.postalCode.trim()) errs.postalCode = "Postal code is required.";
  return errs;
}

function validatePayment(data) {
  const errs = {};
  if (!data.nameOnCard.trim()) errs.nameOnCard = "Name on card is required.";
  if (!data.cardNumber.trim()) {
    errs.cardNumber = "Card number is required.";
  } else if (data.cardNumber.replace(/\s/g, "").length < 13) {
    errs.cardNumber = "Please enter a valid card number.";
  }
  if (!data.expiry.trim()) {
    errs.expiry = "Expiry date is required.";
  } else if (!/^\d{2}\s*\/\s*\d{2}$/.test(data.expiry.trim())) {
    errs.expiry = "Use MM / YY format.";
  }
  if (!data.cvv.trim()) {
    errs.cvv = "CVV is required.";
  } else if (!/^\d{3,4}$/.test(data.cvv.trim())) {
    errs.cvv = "CVV must be 3 or 4 digits.";
  }
  return errs;
}

function Tag({ label }) {
  return (
    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-[#807b7f] text-[#dbd9da] text-sm leading-snug">
      {label}
    </span>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#585157] text-[#f1f2f4] text-sm font-bold hover:bg-[#3e3a3d] transition-colors"
    >
      {label}
      <X size={12} strokeWidth={3} />
    </button>
  );
}

function ProductCard({ product, onView, onAddToCart, showAddToCart = true }) {
  return (
    <div
      className="bg-[#dbd9da] rounded-[40px] flex flex-col cursor-pointer hover:scale-[1.015] transition-transform overflow-hidden"
      onClick={onView}
    >
      <div className="w-full aspect-square flex-shrink-0 overflow-hidden rounded-t-[40px] bg-[#a2a2a2]">
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        )}
      </div>
      <div className="px-5 pt-3 pb-5 flex flex-col gap-2">
        <p className="font-bold text-[#585157] text-[1.35rem] leading-snug">{product.name}</p>
        <div className="flex gap-2 flex-wrap">
          <Tag label={product.type} />
          <Tag label={product.size} />
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-bold text-[#585157] text-[2.4rem] leading-none">{formatPrice(product.price)}</span>
          <span className="text-[#585157] text-sm">CAD</span>
        </div>
        {showAddToCart && (
          <button
            className="mt-1 bg-[#807b7f] text-white font-bold rounded-full py-2.5 px-6 text-sm w-fit hover:bg-[#6b6669] transition-colors active:scale-95"
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
          >
            add to cart
          </button>
        )}
      </div>
    </div>
  );
}

function CategoryDropdown({ filterType, filterSize, onTypeChange, onSizeChange, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 bg-white rounded-3xl shadow-2xl p-5 w-[230px] z-50 border border-[#e8e5e6]">
      <p className="font-bold text-[#585157] text-sm uppercase tracking-wider mb-2.5">Art Type</p>
      <div className="flex flex-col gap-0.5 mb-4">
        {[null, ...ART_TYPES].map((t) => (
          <label key={t ?? "all"} className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl cursor-pointer hover:bg-[#f1f2f4] transition-colors">
            <input type="radio" name="dd-type" checked={filterType === t} onChange={() => onTypeChange(t)} className="accent-[#807b7f] w-3.5 h-3.5" />
            <span className={`text-[#585157] text-sm ${filterType === t ? "font-bold" : ""}`}>{t ? t + "s" : "all types"}</span>
          </label>
        ))}
      </div>
      <div className="border-t border-[#e8e5e6] mb-4" />
      <p className="font-bold text-[#585157] text-sm uppercase tracking-wider mb-2.5">Size</p>
      <div className="flex flex-col gap-0.5">
        {[null, ...SIZES].map((s) => (
          <label key={s ?? "all"} className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl cursor-pointer hover:bg-[#f1f2f4] transition-colors">
            <input type="radio" name="dd-size" checked={filterSize === s} onChange={() => onSizeChange(s)} className="accent-[#807b7f] w-3.5 h-3.5" />
            <span className={`text-[#585157] text-sm ${filterSize === s ? "font-bold" : ""}`}>{s ?? "all sizes"}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FilterSidebar({ filterType, filterSize, onTypeChange, onSizeChange }) {
  return (
    <aside className="w-[180px] flex-shrink-0">
      <p className="font-bold text-[#585157] text-base uppercase tracking-wider mb-3">Art Type</p>
      <div className="flex flex-col gap-0.5 mb-6">
        {[null, ...ART_TYPES].map((t) => (
          <label key={t ?? "all"} className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:opacity-70 transition-opacity">
            <input type="radio" name="sb-type" checked={filterType === t} onChange={() => onTypeChange(t)} className="accent-[#807b7f] w-3.5 h-3.5 flex-shrink-0" />
            <span className={`text-[#585157] text-base ${filterType === t ? "font-bold" : ""}`}>{t ? t + "s" : "all"}</span>
          </label>
        ))}
      </div>
      <div className="border-t border-[#c8c5c6] mb-6" />
      <p className="font-bold text-[#585157] text-base uppercase tracking-wider mb-3">Size</p>
      <div className="flex flex-col gap-0.5">
        {[null, ...SIZES].map((s) => (
          <label key={s ?? "all"} className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:opacity-70 transition-opacity">
            <input type="radio" name="sb-size" checked={filterSize === s} onChange={() => onSizeChange(s)} className="accent-[#807b7f] w-3.5 h-3.5 flex-shrink-0" />
            <span className={`text-[#585157] text-base ${filterSize === s ? "font-bold" : ""}`}>{s ?? "all"}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}

function Nav({ navType, onNavTypeSelect, onLogoClick, onCartClick, cartCount, searchText, onSearchTextChange, onSearchSubmit, filterType, filterSize, onFilterTypeChange, onFilterSizeChange }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const categoryLabel =
    filterType && filterSize ? `${filterType}s · ${filterSize}`
    : filterType ? `${filterType}s`
    : filterSize ? filterSize
    : "All Categories";

  return (
    <header className="bg-[#f1f2f4] px-8 pt-5 sticky top-0 z-50">
      <div className="flex items-center gap-5">
        <button className="font-bold text-[#585157] text-5xl leading-none whitespace-nowrap flex-shrink-0 hover:opacity-80 transition-opacity" onClick={onLogoClick}>
          printed.co
        </button>
        <div className="flex-1 flex items-center bg-[#dbd9da] rounded-full h-[58px] px-5 gap-3">
          <button onClick={onSearchSubmit} className="flex-shrink-0 hover:opacity-70 transition-opacity">
            <Search size={20} color="#807b7f" />
          </button>
          <input
            type="text"
            placeholder="search for anything"
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
            className="flex-1 bg-transparent outline-none text-[#585157] text-lg placeholder:text-[#807b7f]"
          />
          <div className="relative flex-shrink-0">
            <button
              className={`rounded-full px-4 py-2 text-sm flex items-center gap-1.5 transition-colors ${filterType || filterSize ? "bg-[#585157] text-[#f1f2f4] font-bold" : "bg-[#807b7f] text-[#dbd9da] hover:bg-[#6b6669]"}`}
              onClick={() => setShowDropdown((v) => !v)}
            >
              {categoryLabel}
              <ChevronDown size={13} />
            </button>
            {showDropdown && (
              <CategoryDropdown
                filterType={filterType}
                filterSize={filterSize}
                onTypeChange={onFilterTypeChange}
                onSizeChange={onFilterSizeChange}
                onClose={() => setShowDropdown(false)}
              />
            )}
          </div>
        </div>
        <button className="relative flex-shrink-0 p-1" onClick={onCartClick}>
          <ShoppingCart size={34} color="#585157" strokeWidth={2.5} />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#807b7f] text-white text-[10px] rounded-full w-[18px] h-[18px] flex items-center justify-center font-bold leading-none">
              {cartCount}
            </span>
          )}
        </button>
      </div>
      <nav className="flex gap-6 mt-4 pb-3">
        {ART_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onNavTypeSelect(type)}
            className={`font-bold text-[#585157] text-lg transition-all ${navType === type ? "bg-[#dbd9da] px-4 py-1 rounded-full" : "py-1 hover:opacity-60"}`}
          >
            {type}s
          </button>
        ))}
      </nav>
      <div className="border-b border-[#585157]" />
    </header>
  );
}

const STEPS = [
  { key: "billing", label: "billing info" },
  { key: "shipping", label: "shipping info" },
  { key: "payment", label: "payment info" },
  { key: "confirmation", label: "confirmation" },
];

function CheckoutStepper({ current }) {
  const ci = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-start justify-center py-8 px-4">
      {STEPS.map((step, i) => {
        const isActive = i === ci;
        const isDone = i < ci;
        return (
          <div key={step.key} className="flex items-start">
            <div className="flex flex-col items-center w-[110px]">
              <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center ${isActive ? "bg-[#D9D9D9]" : "border-2 border-[#585157]"}`}>
                <span className={`text-2xl text-[#585157] ${isActive ? "font-bold" : ""}`}>{i + 1}</span>
              </div>
              <p className={`mt-2 text-xs text-center text-[#585157] leading-tight ${isActive ? "font-bold" : ""}`}>{step.label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mt-[26px] w-16 border-t-2 ${isDone ? "border-solid border-[#585157]" : "border-dashed border-[#585157]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FormField({ label, required, value, onChange, type = "text", placeholder = "", disabled = false, error, numeric = false }) {
  const handleChange = (e) => {
    const v = numeric ? e.target.value.replace(/\D/g, "") : e.target.value;
    onChange(v);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[#5a4742] text-xl">
        {label}{" "}
        {required && <span className="text-base opacity-60">(Required)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        inputMode={numeric ? "numeric" : undefined}
        placeholder={placeholder}
        disabled={disabled}
        className={`bg-[#ccc9ca] rounded-full h-[58px] px-6 text-[#585157] text-base outline-none transition-all disabled:opacity-60 ${
          error ? "ring-2 ring-red-400" : "focus:ring-2 focus:ring-[#807b7f]"
        }`}
      />
      {error && <p className="text-red-500 text-sm px-2">{error}</p>}
    </div>
  );
}

const RATING_LABELS = { 1: "very unsatisfied", 2: "unsatisfied", 3: "neutral", 4: "satisfied", 5: "very satisfied" };

function RatingQuestion({ question, value, onChange, error }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[#5a4742] text-xl">{question}</p>
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex flex-col items-center gap-1.5 flex-1 py-3 rounded-[24px] border-2 transition-all ${
                active ? "bg-[#807b7f] border-[#807b7f] text-white" : "border-[#807b7f] text-[#807b7f] hover:bg-[#807b7f]/10"
              }`}
            >
              <span className="text-2xl font-bold leading-none">{n}</span>
              <span className={`text-[11px] leading-tight text-center ${active ? "text-white/80" : "text-[#807b7f]"}`}>{RATING_LABELS[n]}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-red-500 text-sm px-1">{error}</p>}
    </div>
  );
}

function HomePage({ products, onViewProduct, onAddToCart, onCategoryClick }) {
  const [offset, setOffset] = useState(0);
  const visible = products.slice(offset, offset + 3);

  return (
    <main className="px-8 py-8">
      <section className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-[#585157] text-[2.4rem] leading-none">top sellers</h2>
          <div className="flex gap-1">
            <button className="w-10 h-10 flex items-center justify-center text-[#585157] disabled:opacity-25 hover:opacity-60 transition-opacity" onClick={() => setOffset(Math.max(0, offset - 1))} disabled={offset === 0}>
              <ChevronLeft size={34} strokeWidth={2.5} />
            </button>
            <button className="w-10 h-10 flex items-center justify-center text-[#585157] disabled:opacity-25 hover:opacity-60 transition-opacity" onClick={() => setOffset(Math.min(products.length - 3, offset + 1))} disabled={offset >= products.length - 3}>
              <ChevronRight size={34} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} onView={() => onViewProduct(p)} onAddToCart={() => onAddToCart(p)} showAddToCart={false} />
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-bold text-[#585157] text-[2.4rem] leading-none mb-6">discover our products</h2>
        <div className="grid grid-cols-3 gap-4">
          {["poster", "print", "painting", "keychain"].map((type, i) => {
            const spans = [1, 2, 2, 1];
            return (
              <div
                key={type}
                style={{ gridColumn: `span ${spans[i]}` }}
                className="bg-[#a2a2a2] rounded-[43px] h-[320px] flex items-end p-8 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onCategoryClick(type)}
              >
                <span className="font-bold text-[#f1f2f4] text-5xl">{type}s</span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function SearchPage({ products, heading, activeSearch, navType, filterType, filterSize, onFilterTypeChange, onFilterSizeChange, onClearSearch, onClearNavType, onViewProduct, onAddToCart }) {
  const hasActiveFilters = activeSearch || navType || filterType || filterSize;

  return (
    <main className="px-8 py-8">
      <div className="flex gap-10">
        <FilterSidebar filterType={filterType} filterSize={filterSize} onTypeChange={onFilterTypeChange} onSizeChange={onFilterSizeChange} />
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <h2 className="font-bold text-[#585157] text-[2.4rem] leading-none mb-3">{heading}</h2>
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#807b7f] text-sm">active filters:</span>
                {activeSearch && <FilterChip label={`"${activeSearch}"`} onRemove={onClearSearch} />}
                {navType && !filterType && <FilterChip label={`${navType}s`} onRemove={onClearNavType} />}
                {filterType && <FilterChip label={`${filterType}s`} onRemove={() => onFilterTypeChange(null)} />}
                {filterSize && <FilterChip label={filterSize} onRemove={() => onFilterSizeChange(null)} />}
              </div>
            )}
          </div>
          {products.length === 0 ? (
            <p className="text-[#807b7f] text-xl mt-12">No products found.</p>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onView={() => onViewProduct(p)} onAddToCart={() => onAddToCart(p)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ProductDetailPage({ product, onAddToCart, onBack }) {
  return (
    <main className="px-8 py-8">
      <button className="text-[#807b7f] text-base mb-8 flex items-center gap-1 hover:opacity-70 transition-opacity" onClick={onBack}>
        <ChevronLeft size={16} /> back
      </button>
      <div className="flex gap-12 items-start">
        <div className="bg-[#d9d9d9] rounded-[43px] w-[500px] h-[500px] flex-shrink-0 overflow-hidden">
          {product.image && (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-4 pt-2">
          <h1 className="font-bold text-[#585157] text-6xl leading-[1.05]">{product.name}</h1>
          <p className="text-[#585157] text-4xl">{formatPrice(product.price)} CAD</p>
          <p className="text-[#585157] text-2xl leading-relaxed max-w-[560px] mt-1">{product.description}</p>
          <div className="flex gap-2 mt-1">
            <Tag label={product.type} />
            <Tag label={product.size} />
          </div>
          <button className="mt-5 bg-[#807b7f] text-white font-bold rounded-full py-5 px-12 text-2xl w-fit hover:bg-[#6b6669] transition-colors active:scale-95" onClick={() => onAddToCart(product)}>
            add to cart
          </button>
        </div>
      </div>
    </main>
  );
}

function CartPage({ items, onQtyChange, onRemove, onCheckout, onShop }) {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <main className="px-8 py-8 max-w-[860px]">
      <h1 className="font-bold text-[#585157] text-[5rem] leading-none mb-10">my cart</h1>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-8 py-20">
          <p className="text-[#807b7f] text-2xl">Your cart is empty.</p>
          <button className="bg-[#807b7f] text-white font-bold rounded-full py-4 px-12 text-xl hover:bg-[#6b6669] transition-colors" onClick={onShop}>
            continue shopping
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-8">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-6">
                <div className="bg-[#d9d9d9] rounded-[24px] w-[220px] h-[220px] flex-shrink-0 overflow-hidden">
                  {item.product.image && (
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-bold text-[#585157] text-3xl leading-tight">{item.product.name}</p>
                  <p className="text-[#585157] text-3xl">{formatPrice(item.product.price)} CAD</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="relative bg-[#d9d9d9] rounded-full h-[52px] w-[90px] flex items-center justify-center">
                      <span className="text-[#585157] text-2xl select-none">{item.quantity}</span>
                      <div className="absolute right-2.5 flex flex-col gap-0.5">
                        <button onClick={() => onQtyChange(item.product.id, item.quantity + 1)} className="text-[#585157] hover:opacity-50 transition-opacity">
                          <ChevronUp size={13} strokeWidth={3} />
                        </button>
                        <button onClick={() => onQtyChange(item.product.id, Math.max(1, item.quantity - 1))} className="text-[#585157] hover:opacity-50 transition-opacity">
                          <ChevronDown size={13} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                    <button className="bg-[#d9d9d9] rounded-full h-[52px] px-7 text-[#585157] font-bold text-xl hover:bg-[#c5c5c5] transition-colors" onClick={() => onRemove(item.product.id)}>
                      remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 border-t border-[#585157] pt-6">
            <div className="flex flex-col items-end gap-2 mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-[#807b7f] text-lg w-24 text-right">subtotal</span>
                <span className="text-[#585157] text-2xl w-36 text-right">{formatPrice(subtotal)}</span>
                <span className="text-[#585157] text-base">CAD</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[#807b7f] text-lg w-24 text-right">tax (13%)</span>
                <span className="text-[#585157] text-2xl w-36 text-right">{formatPrice(tax)}</span>
                <span className="text-[#585157] text-base">CAD</span>
              </div>
              <div className="flex items-baseline gap-2 mt-2 pt-3 border-t border-[#585157] w-full justify-end">
                <span className="text-[#585157] text-2xl">=</span>
                <span className="font-bold text-[#585157] text-5xl">{total.toFixed(2)}</span>
                <span className="text-[#585157] text-xl">CAD</span>
              </div>
            </div>
            <div className="flex justify-center">
              <button className="bg-[#807b7f] text-white font-bold rounded-full py-5 px-14 text-2xl hover:bg-[#6b6669] transition-colors active:scale-95" onClick={onCheckout}>
                proceed to checkout
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function AddressFields({ data, onChange, disabled, errors }) {
  const f = (k) => (v) => onChange({ ...data, [k]: v });
  return (
    <>
      <FormField label="street name & number" required value={data.street} onChange={f("street")} placeholder="123 Main St" disabled={disabled} error={errors.street} />
      <div className="grid grid-cols-2 gap-6">
        <FormField label="city" required value={data.city} onChange={f("city")} disabled={disabled} error={errors.city} />
        <FormField label="country" required value={data.country} onChange={f("country")} disabled={disabled} error={errors.country} />
      </div>
      <FormField label="postal code" required value={data.postalCode} onChange={f("postalCode")} disabled={disabled} error={errors.postalCode} numeric />
    </>
  );
}

function BillingPage({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({});
  const f = (k) => (v) => { onChange({ ...data, [k]: v }); setErrors((e) => ({ ...e, [k]: undefined })); };

  const handleNext = () => {
    const errs = validatePerson(data);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onNext();
  };

  return (
    <div className="min-h-screen bg-[#f1f2f4] px-8 pb-16">
      <CheckoutStepper current="billing" />
      <div className="bg-[#dbd9da] rounded-[43px] max-w-[900px] mx-auto px-14 py-12">
        <h1 className="font-bold text-[#585157] text-[5rem] leading-none mb-10">billing info</h1>
        <div className="flex flex-col gap-7">
          <FormField label="first name" required value={data.firstName} onChange={f("firstName")} error={errors.firstName} />
          <FormField label="last name" required value={data.lastName} onChange={f("lastName")} error={errors.lastName} />
          <FormField label="email" required type="email" value={data.email} onChange={f("email")} error={errors.email} />
          <FormField label="phone number" required value={data.phone} onChange={f("phone")} error={errors.phone} numeric />
          <AddressFields data={data} onChange={onChange} disabled={false} errors={errors} />
        </div>
        <div className="flex justify-center mt-12">
          <button className="bg-[#807b7f] text-white font-bold rounded-full py-4 px-16 text-2xl hover:bg-[#6b6669] transition-colors active:scale-95" onClick={handleNext}>next</button>
        </div>
      </div>
    </div>
  );
}

function ShippingPage({ data, onChange, billing, onNext }) {
  const [same, setSame] = useState(false);
  const [errors, setErrors] = useState({});

  const toggle = () => { const n = !same; setSame(n); if (n) { onChange({ ...billing }); setErrors({}); } };
  const eff = same ? billing : data;
  const f = (k) => (v) => { if (!same) { onChange({ ...data, [k]: v }); setErrors((e) => ({ ...e, [k]: undefined })); } };

  const handleNext = () => {
    const errs = validatePerson(eff);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onNext();
  };

  return (
    <div className="min-h-screen bg-[#f1f2f4] px-8 pb-16">
      <CheckoutStepper current="shipping" />
      <div className="bg-[#dbd9da] rounded-[43px] max-w-[900px] mx-auto px-14 py-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-bold text-[#585157] text-[5rem] leading-none">shipping info</h1>
          <button className="flex items-center gap-3 flex-shrink-0" onClick={toggle} type="button">
            <div className={`relative w-[52px] h-[26px] rounded-full transition-colors ${same ? "bg-[#807b7f]" : "bg-[#9e9a9c]"}`}>
              <div className={`absolute top-[3px] w-[20px] h-[20px] bg-[#dbd9da] rounded-full transition-transform ${same ? "translate-x-[28px]" : "translate-x-[3px]"}`} />
            </div>
            <span className="text-[#585157] text-base whitespace-nowrap">same as billing info</span>
          </button>
        </div>
        <div className="flex flex-col gap-7">
          <FormField label="first name" required value={eff.firstName} onChange={f("firstName")} disabled={same} error={errors.firstName} />
          <FormField label="last name" required value={eff.lastName} onChange={f("lastName")} disabled={same} error={errors.lastName} />
          <FormField label="email" required type="email" value={eff.email} onChange={f("email")} disabled={same} error={errors.email} />
          <FormField label="phone number" required value={eff.phone} onChange={f("phone")} disabled={same} error={errors.phone} numeric />
          <AddressFields data={eff} onChange={same ? () => {} : onChange} disabled={same} errors={errors} />
        </div>
        <div className="flex justify-center mt-12">
          <button className="bg-[#807b7f] text-white font-bold rounded-full py-4 px-16 text-2xl hover:bg-[#6b6669] transition-colors active:scale-95" onClick={handleNext}>next</button>
        </div>
      </div>
    </div>
  );
}

function PaymentPage({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({});
  const f = (k) => (v) => { onChange({ ...data, [k]: v }); setErrors((e) => ({ ...e, [k]: undefined })); };

  const handleNext = () => {
    const errs = validatePayment(data);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onNext();
  };

  return (
    <div className="min-h-screen bg-[#f1f2f4] px-8 pb-16">
      <CheckoutStepper current="payment" />
      <div className="bg-[#dbd9da] rounded-[43px] max-w-[900px] mx-auto px-14 py-12">
        <h1 className="font-bold text-[#585157] text-[5rem] leading-none mb-10">payment info</h1>
        <div className="flex flex-col gap-7">
          <FormField label="name on card" required value={data.nameOnCard} onChange={f("nameOnCard")} error={errors.nameOnCard} />
          <FormField label="card number" required value={data.cardNumber} placeholder="1234567890123456" onChange={f("cardNumber")} error={errors.cardNumber} numeric />
          <div className="grid grid-cols-2 gap-6">
            <FormField label="expiry date" required value={data.expiry} placeholder="MM / YY" onChange={f("expiry")} error={errors.expiry} />
            <FormField label="CVV" required value={data.cvv} placeholder="123" onChange={f("cvv")} error={errors.cvv} numeric />
          </div>
        </div>
        <div className="flex justify-center mt-12">
          <button className="bg-[#807b7f] text-white font-bold rounded-full py-4 px-16 text-2xl hover:bg-[#6b6669] transition-colors active:scale-95" onClick={handleNext}>next</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmationPage({ items, onHome, onSurvey }) {
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-[#f1f2f4] px-8 pb-16">
      <CheckoutStepper current="confirmation" />
      <div className="max-w-[720px] mx-auto">
        <h1 className="font-bold text-[#585157] text-[4rem] leading-[1.05] text-center mb-12">your order has been confirmed!</h1>
        <div className="flex flex-col gap-6 mb-8">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-6">
              <div className="bg-[#d9d9d9] rounded-[24px] w-[160px] h-[160px] flex-shrink-0 overflow-hidden">
                {item.product.image && (
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                )}
              </div>
              <div>
                <p className="font-bold text-[#585157] text-2xl">{item.product.name}</p>
                <p className="text-[#585157] text-3xl mt-1">{formatPrice(item.product.price)} CAD</p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#585157] pt-5 mb-6">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-[#807b7f] text-lg w-24 text-right">subtotal</span>
              <span className="text-[#585157] text-2xl w-32 text-right">{formatPrice(subtotal)}</span>
              <span className="text-[#585157] text-base">CAD</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[#807b7f] text-lg w-24 text-right">tax (13%)</span>
              <span className="text-[#585157] text-2xl w-32 text-right">{formatPrice(tax)}</span>
              <span className="text-[#585157] text-base">CAD</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2 pt-2 border-t border-[#585157] w-full justify-end">
              <span className="text-[#585157] text-2xl">=</span>
              <span className="font-bold text-[#585157] text-5xl">{total.toFixed(2)}</span>
              <span className="text-[#585157] text-xl">CAD</span>
            </div>
          </div>
        </div>
        <div className="text-center mb-10">
          <button onClick={onSurvey} className="text-[#585157] text-sm underline underline-offset-2 hover:opacity-70 transition-opacity">
            click here to review your experience and get 10% off your next order!
          </button>
        </div>
        <div className="flex justify-center">
          <button className="bg-[#807b7f] text-white font-bold rounded-full py-5 px-12 text-2xl hover:bg-[#6b6669] transition-colors active:scale-95" onClick={onHome}>
            back to home
          </button>
        </div>
      </div>
    </div>
  );
}

const SURVEY_QUESTIONS = [
  "overall satisfaction with your order",
  "quality of the products",
  "shipping & delivery experience",
  "ease of shopping on our site",
  "how likely are you to recommend printed.co?",
];

function SurveyPage({ onDone }) {
  const [ratings, setRatings] = useState(SURVEY_QUESTIONS.map(() => null));
  const [comments, setComments] = useState("");
  const [errors, setErrors] = useState(SURVEY_QUESTIONS.map(() => undefined));
  const [submitted, setSubmitted] = useState(false);

  const [discountCode] = useState(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  });

  const setRating = (i, n) => {
    setRatings((r) => { const next = [...r]; next[i] = n; return next; });
    setErrors((e) => { const next = [...e]; next[i] = undefined; return next; });
  };

  const handleSubmit = () => {
    const newErrors = ratings.map((r) => (r === null ? "Please select a rating." : undefined));
    if (newErrors.some(Boolean)) { setErrors(newErrors); return; }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f1f2f4] flex items-center justify-center px-8">
        <div className="bg-[#dbd9da] rounded-[43px] max-w-[720px] w-full px-14 py-16 flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-[#807b7f] flex items-center justify-center mb-2">
            <span className="text-white text-4xl">✓</span>
          </div>
          <h1 className="font-bold text-[#585157] text-[3.5rem] leading-[1.1]">thank you for your feedback!</h1>
          <p className="text-[#585157] text-xl max-w-[480px]">Your 10% discount code has been sent to your email. We appreciate you taking the time to share your experience.</p>
          <div className="bg-[#ccc9ca] rounded-[20px] px-8 py-4 mt-2">
            <p className="text-[#585157] text-sm mb-1">your discount code</p>
            <p className="font-bold text-[#585157] text-3xl tracking-widest">{discountCode}</p>
          </div>
          <button className="mt-4 bg-[#807b7f] text-white font-bold rounded-full py-4 px-12 text-xl hover:bg-[#6b6669] transition-colors active:scale-95" onClick={onDone}>
            back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f2f4] px-8 pb-16 pt-10">
      <div className="bg-[#dbd9da] rounded-[43px] max-w-[900px] mx-auto px-14 py-12">
        <div className="mb-10">
          <h1 className="font-bold text-[#585157] text-[4rem] leading-[1.05]">share your experience</h1>
          <p className="text-[#807b7f] text-xl mt-2">Complete this short survey and receive 10% off your next order.</p>
        </div>
        <div className="flex flex-col gap-10">
          {SURVEY_QUESTIONS.map((q, i) => (
            <RatingQuestion key={i} question={q} value={ratings[i]} onChange={(n) => setRating(i, n)} error={errors[i]} />
          ))}
          <div className="flex flex-col gap-3">
            <label className="text-[#5a4742] text-xl">
              any additional comments? <span className="text-base opacity-60">(Optional)</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="tell us more about your experience..."
              rows={4}
              className="bg-[#ccc9ca] rounded-[28px] px-6 py-4 text-[#585157] text-base outline-none focus:ring-2 focus:ring-[#807b7f] transition-all resize-none placeholder:text-[#807b7f]"
            />
          </div>
        </div>
        <div className="flex justify-center mt-12">
          <button className="bg-[#807b7f] text-white font-bold rounded-full py-4 px-16 text-2xl hover:bg-[#6b6669] transition-colors active:scale-95" onClick={handleSubmit}>
            submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [prevView, setPrevView] = useState("home");
  const [checkoutStep, setCheckoutStep] = useState("billing");

  const [searchText, setSearchText] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [navType, setNavType] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [filterSize, setFilterSize] = useState(null);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [billing, setBilling] = useState({ ...EMPTY_PERSON });
  const [shipping, setShipping] = useState({ ...EMPTY_PERSON });
  const [payment, setPayment] = useState({ ...EMPTY_PAYMENT });
  const [confirmedItems, setConfirmedItems] = useState([]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const filteredProducts = useMemo(() => {
    let r = PRODUCTS;
    if (activeSearch.trim()) {
      const q = activeSearch.toLowerCase();
      r = r.filter((p) => p.name.includes(q) || p.type.includes(q) || p.size.includes(q));
    } else if (navType) {
      r = r.filter((p) => p.type === navType);
    }
    if (filterType) r = r.filter((p) => p.type === filterType);
    if (filterSize) r = r.filter((p) => p.size === filterSize);
    return r;
  }, [activeSearch, navType, filterType, filterSize]);

  const searchHeading = activeSearch
    ? `results for "${activeSearch}"`
    : navType ? `${navType}s`
    : filterType ? `${filterType}s`
    : filterSize ? filterSize
    : "all products";

  const addToCart = (product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
    toast(`"${product.name}" added to cart`);
  };

  const handleNavTypeSelect = (type) => {
    setNavType((prev) => (prev === type ? null : type));
    setActiveSearch("");
    setSearchText("");
    setFilterType(null);
    setView("search");
  };

  const handleSearchSubmit = () => {
    setActiveSearch(searchText.trim());
    setNavType(null);
    setView("search");
  };

  const handleFilterTypeChange = (t) => {
    setFilterType(t);
    if (view !== "search") setView("search");
  };

  const handleFilterSizeChange = (s) => {
    setFilterSize(s);
    if (view !== "search") setView("search");
  };

  const handleCategoryTileClick = (type) => {
    setNavType(type);
    setActiveSearch("");
    setSearchText("");
    setFilterType(null);
    setFilterSize(null);
    setView("search");
  };

  const handleLogoClick = () => {
    setView("home");
    setNavType(null);
    setActiveSearch("");
    setSearchText("");
    setFilterType(null);
    setFilterSize(null);
  };

  const handleViewProduct = (product) => {
    setPrevView(view === "home" ? "home" : "search");
    setSelectedProduct(product);
    setView("product");
  };

  const handleBackToHome = () => {
    setView("home");
    setCheckoutStep("billing");
    setBilling({ ...EMPTY_PERSON });
    setShipping({ ...EMPTY_PERSON });
    setPayment({ ...EMPTY_PAYMENT });
    setNavType(null);
    setActiveSearch("");
    setSearchText("");
    setFilterType(null);
    setFilterSize(null);
  };

  const fontStyle = { fontFamily: "'Space Grotesk', sans-serif" };

  if (view === "checkout") {
    const wrap = (children) => (
      <div style={fontStyle}><Toaster richColors />{children}</div>
    );
    if (checkoutStep === "billing")
      return wrap(<BillingPage data={billing} onChange={setBilling} onNext={() => setCheckoutStep("shipping")} />);
    if (checkoutStep === "shipping")
      return wrap(<ShippingPage data={shipping} onChange={setShipping} billing={billing} onNext={() => setCheckoutStep("payment")} />);
    if (checkoutStep === "payment")
      return wrap(
        <PaymentPage data={payment} onChange={setPayment} onNext={() => { setConfirmedItems([...cart]); setCart([]); setCheckoutStep("confirmation"); }} />
      );
    if (checkoutStep === "confirmation")
      return wrap(<ConfirmationPage items={confirmedItems} onHome={handleBackToHome} onSurvey={() => setView("survey")} />);
  }

  if (view === "survey") {
    return (
      <div style={fontStyle}><Toaster richColors /><SurveyPage onDone={handleBackToHome} /></div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f2f4]" style={fontStyle}>
      <Toaster richColors position="bottom-right" />
      <Nav
        navType={navType}
        onNavTypeSelect={handleNavTypeSelect}
        onLogoClick={handleLogoClick}
        onCartClick={() => setView("cart")}
        cartCount={cartCount}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onSearchSubmit={handleSearchSubmit}
        filterType={filterType}
        filterSize={filterSize}
        onFilterTypeChange={handleFilterTypeChange}
        onFilterSizeChange={handleFilterSizeChange}
      />
      {view === "home" && <HomePage products={PRODUCTS} onViewProduct={handleViewProduct} onAddToCart={addToCart} onCategoryClick={handleCategoryTileClick} />}
      {view === "search" && (
        <SearchPage
          products={filteredProducts}
          heading={searchHeading}
          activeSearch={activeSearch}
          navType={navType}
          filterType={filterType}
          filterSize={filterSize}
          onFilterTypeChange={handleFilterTypeChange}
          onFilterSizeChange={handleFilterSizeChange}
          onClearSearch={() => { setActiveSearch(""); setSearchText(""); }}
          onClearNavType={() => setNavType(null)}
          onViewProduct={handleViewProduct}
          onAddToCart={addToCart}
        />
      )}
      {view === "product" && selectedProduct && (
        <ProductDetailPage product={selectedProduct} onAddToCart={addToCart} onBack={() => setView(prevView)} />
      )}
      {view === "cart" && (
        <CartPage
          items={cart}
          onQtyChange={(id, qty) => setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: qty } : i))}
          onRemove={(id) => setCart((prev) => prev.filter((i) => i.product.id !== id))}
          onCheckout={() => { setCheckoutStep("billing"); setView("checkout"); }}
          onShop={() => setView("home")}
        />
      )}
    </div>
  );
}
