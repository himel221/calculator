// src/screens/HomeScreen.js
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  StyleSheet,
  Platform,
  Dimensions,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SCREEN_H = Dimensions.get("window").height;
const SCREEN_W = Dimensions.get("window").width;
const SAFE_TOP = Platform.OS === "android" ? 32 : 0;

// ─── Theme Colors ───
const THEMES = {
  dark: {
    bg: "#09090f",
    surface: "#111118",
    surface2: "#1a1a24",
    border: "#2a2a3a",
    text: "#e8e8f0",
    textSub: "#a0a0b8",
    muted: "#6a6a80",
    blue: "#4a7cff",
    green: "#2dd4a0",
    red: "#f06060",
  },
  light: {
    bg: "#f5f5f5",
    surface: "#ffffff",
    surface2: "#f0f0f0",
    border: "#e0e0e0",
    text: "#1a1a1a",
    textSub: "#666666",
    muted: "#999999",
    blue: "#4a7cff",
    green: "#2dd4a0",
    red: "#f06060",
  }
};

const MONO = Platform.select({ ios: "Menlo", android: "monospace" });

const KEYS = { 
  products: "@sp_products", 
  units: "@sp_units", 
  categories: "@sp_categories", 
  history: "@sp_history", 
  converters: "@sp_converters",
  theme: "@sp_theme" 
};

// ─── Predefined Currencies List (38 Currencies) ───
const PREDEFINED_CURRENCIES = [
  { id: "usd", label: "US Dollar", symbol: "$", type: "currency" },
  { id: "eur", label: "Euro", symbol: "€", type: "currency" },
  { id: "gbp", label: "British Pound", symbol: "£", type: "currency" },
  { id: "bdt", label: "Bangladeshi Taka", symbol: "৳", type: "currency" },
  { id: "inr", label: "Indian Rupee", symbol: "₹", type: "currency" },
  { id: "jpy", label: "Japanese Yen", symbol: "¥", type: "currency" },
  { id: "cny", label: "Chinese Yuan", symbol: "¥", type: "currency" },
  { id: "aud", label: "Australian Dollar", symbol: "A$", type: "currency" },
  { id: "cad", label: "Canadian Dollar", symbol: "C$", type: "currency" },
  { id: "chf", label: "Swiss Franc", symbol: "Fr", type: "currency" },
  { id: "myr", label: "Malaysian Ringgit", symbol: "RM", type: "currency" },
  { id: "sgd", label: "Singapore Dollar", symbol: "S$", type: "currency" },
  { id: "pkr", label: "Pakistani Rupee", symbol: "₨", type: "currency" },
  { id: "npr", label: "Nepalese Rupee", symbol: "Rs", type: "currency" },
  { id: "lkr", label: "Sri Lankan Rupee", symbol: "Rs", type: "currency" },
  { id: "idr", label: "Indonesian Rupiah", symbol: "Rp", type: "currency" },
  { id: "php", label: "Philippine Peso", symbol: "₱", type: "currency" },
  { id: "thb", label: "Thai Baht", symbol: "฿", type: "currency" },
  { id: "vnd", label: "Vietnamese Dong", symbol: "₫", type: "currency" },
  { id: "kwd", label: "Kuwaiti Dinar", symbol: "د.ك", type: "currency" },
  { id: "sar", label: "Saudi Riyal", symbol: "﷼", type: "currency" },
  { id: "aed", label: "UAE Dirham", symbol: "د.إ", type: "currency" },
  { id: "nzd", label: "New Zealand Dollar", symbol: "NZ$", type: "currency" },
  { id: "zar", label: "South African Rand", symbol: "R", type: "currency" },
  { id: "sek", label: "Swedish Krona", symbol: "kr", type: "currency" },
  { id: "nok", label: "Norwegian Krone", symbol: "kr", type: "currency" },
  { id: "dkk", label: "Danish Krone", symbol: "kr", type: "currency" },
  { id: "pln", label: "Polish Zloty", symbol: "zł", type: "currency" },
  { id: "huf", label: "Hungarian Forint", symbol: "Ft", type: "currency" },
  { id: "czk", label: "Czech Koruna", symbol: "Kč", type: "currency" },
  { id: "ils", label: "Israeli Shekel", symbol: "₪", type: "currency" },
  { id: "mxn", label: "Mexican Peso", symbol: "$", type: "currency" },
  { id: "brl", label: "Brazilian Real", symbol: "R$", type: "currency" },
  { id: "rub", label: "Russian Ruble", symbol: "₽", type: "currency" },
  { id: "try", label: "Turkish Lira", symbol: "₺", type: "currency" },
  { id: "krw", label: "South Korean Won", symbol: "₩", type: "currency" },
  { id: "twd", label: "Taiwan Dollar", symbol: "NT$", type: "currency" },
  { id: "hkd", label: "Hong Kong Dollar", symbol: "HK$", type: "currency" },
];

const DEFAULT_UNITS = PREDEFINED_CURRENCIES;
const DEFAULT_PRODUCTS = [];
const DEFAULT_CATEGORIES = [];

async function dbSave(key, data) { 
  try { 
    await AsyncStorage.setItem(key, JSON.stringify(data)); 
  } catch (e) { 
    console.warn("DB Save:", e); 
  } 
}

async function dbLoad(key, fb) { 
  try { 
    const r = await AsyncStorage.getItem(key); 
    return r ? JSON.parse(r) : fb; 
  } catch { 
    return fb; 
  } 
}

function freshCostRow(cats, units) {
  return { 
    id: Date.now().toString() + Math.random(), 
    categoryId: cats[0]?.id ?? "", 
    amount: "",
    isPercentage: false,
    percentageValue: "",
    percentageRefId: null,
  };
}

// ─── ConvBadge Component ───
function ConvBadge({ symbol, value, color, theme }) {
  const C = theme || THEMES.dark;
  const bg = color === C.green ? "rgba(45,212,160,0.12)" : "rgba(74,124,255,0.12)";
  const bdr = color === C.green ? "rgba(45,212,160,0.25)" : "rgba(74,124,255,0.25)";
  return (
    <View style={{ backgroundColor: bg, borderWidth: 1, borderColor: bdr, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 3, marginTop: 1 }}>
      <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: "700", color }}>
        ≈{symbol}{value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
    </View>
  );
}

// ─── POPUP DROPDOWN ───
function PopupDropdown({ visible, onClose, options, onSelect, anchorLayout, theme }) {
  if (!visible || !anchorLayout) return null;
  
  const C = theme || THEMES.dark;
  const maxH = Math.min(250, SCREEN_H * 0.45);
  const itemHeight = 44;
  const listH = Math.min(options.length * itemHeight, maxH);
  
  const margin = 12;
  const belowSpace = SCREEN_H - anchorLayout.py - anchorLayout.height - margin;
  const aboveSpace = anchorLayout.py - margin;
  
  let top;
  let finalHeight = listH;
  
  if (belowSpace >= listH + 20) {
    top = anchorLayout.py + anchorLayout.height + 6;
  } else if (aboveSpace >= listH + 20) {
    top = anchorLayout.py - listH - 6;
  } else {
    top = anchorLayout.py + anchorLayout.height + 6;
    finalHeight = Math.min(listH, SCREEN_H - top - margin - 20);
  }
  
  const finalTop = Math.max(margin, Math.min(top, SCREEN_H - finalHeight - margin));
  const finalLeft = Math.max(margin, Math.min(anchorLayout.px, SCREEN_W - anchorLayout.width - margin));
  const finalWidth = Math.min(anchorLayout.width, SCREEN_W - (margin * 2));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}>
        <View style={{ flex: 1 }}>
          <View style={{
            position: "absolute",
            top: finalTop,
            left: finalLeft,
            width: finalWidth,
            maxHeight: finalHeight,
            backgroundColor: C.surface2,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
            elevation: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.6,
            shadowRadius: 24,
            zIndex: 9999,
          }}>
            <ScrollView nestedScrollEnabled bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
              {options.map((item, idx) => (
                <TouchableOpacity 
                  key={item.value} 
                  onPress={() => { onSelect(item.value); onClose(); }}
                  style={{ 
                    paddingVertical: 12, 
                    paddingHorizontal: 14, 
                    borderTopWidth: idx > 0 ? 1 : 0, 
                    borderTopColor: C.border,
                    backgroundColor: idx % 2 === 0 ? C.surface2 : C.surface,
                  }}
                >
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: "500" }} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
              {options.length === 0 && (
                <View style={{ padding: 16 }}>
                  <Text style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>No options available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function DropdownButton({ label, value, options, onPress, onAdd, theme, showAdd = true }) {
  const C = theme || THEMES.dark;
  const selected = options.find((o) => o.value === value);
  return (
    <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={s.dropdownHeader}>
        <Text style={[s.label, { color: C.muted }]}>{label}</Text>
        {showAdd && (
          <TouchableOpacity onPress={onAdd} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 11, color: C.blue, fontWeight: "700", fontFamily: MONO }}>+</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity onPress={onPress} style={s.dropdownValue}>
        <Text style={{ color: C.text, fontWeight: "600", fontSize: 13, flex: 1 }} numberOfLines={1}>{selected?.label ?? "—"}</Text>
        <Text style={[s.chevron, { color: C.muted }]}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

function ManageList({ title, items, onDelete, onAdd, theme, hideAdd = false }) {
  const C = theme || THEMES.dark;
  return (
    <View>
      <View style={s.manageHeader}>
        <Text style={[s.label, { color: C.muted }]}>{title} ({items.length})</Text>
        {!hideAdd && (
          <TouchableOpacity onPress={onAdd}><Text style={{ fontSize: 12, color: C.blue, fontWeight: "600" }}>+ Add</Text></TouchableOpacity>
        )}
      </View>
      <View style={{ gap: 5 }}>
        {items.map((item) => (
          <View key={item.id} style={[s.manageItem, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "500", color: C.text }}>{item.name}</Text>
              {item.sub !== "" && <Text style={{ fontSize: 9, fontFamily: MONO, color: C.muted, marginTop: 2 }}>{item.sub}</Text>}
            </View>
            {!hideAdd && (
              <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={{ color: C.muted, fontSize: 11 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {items.length === 0 && <Text style={{ color: C.muted, fontSize: 12, paddingVertical: 4 }}>Nothing added yet.</Text>}
      </View>
    </View>
  );
}

// ─── Keyboard-aware TextInput wrapper ───
function KBInput({ scrollRef, ...props }) {
  const inputRef = useRef(null);
  const handleFocus = useCallback(() => {
    if (!inputRef.current || !scrollRef?.current) return;
    setTimeout(() => {
      try {
        inputRef.current.measureInWindow((x, y, w, h) => {
          const keyboardHeight = Platform.OS === "ios" ? 320 : 280;
          const bottomOfInput = y + h;
          const visibleBottom = SCREEN_H - keyboardHeight;
          if (bottomOfInput > visibleBottom - 40) {
            const scrollAmount = bottomOfInput - visibleBottom + 80;
            scrollRef.current.scrollTo({ y: (scrollRef.current._currentScrollY || 0) + scrollAmount, animated: true });
          }
        });
      } catch {}
    }, 350);
  }, [scrollRef]);

  return (
    <TextInput
      {...props}
      ref={(el) => { inputRef.current = el; }}
      onFocus={(e) => { handleFocus(); props.onFocus?.(e); }}
    />
  );
}

// ════════════════════════════════════════════
// ─── MAIN APP COMPONENT ────────────────────
// ════════════════════════════════════════════
export default function App() {
  // ─── All Hooks at Top Level ───
  const [dbReady, setDbReady] = useState(false);
  const [tab, setTab] = useState("calc");
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [history, setHistory] = useState([]);
  const [converterPairs, setConverterPairs] = useState([]);
  const [toast, setToast] = useState(null);
  const [title, setTitle] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [costItems, setCostItems] = useState([]);
  const [profitView, setProfitView] = useState("both");
  const [resultUnitId, setResultUnitId] = useState("");
  const [conversionRate, setConversionRate] = useState("1");
  const [result, setResult] = useState(null);
  const [sellingMode, setSellingMode] = useState("price");
  const [targetMargin, setTargetMargin] = useState("");
  const [sheet, setSheet] = useState(null);
  const [newProductName, setNewProductName] = useState("");
  const [newUnitLabel, setNewUnitLabel] = useState("");
  const [newUnitSymbol, setNewUnitSymbol] = useState("");
  const [newUnitType, setNewUnitType] = useState("currency");
  const [newCatName, setNewCatName] = useState("");
  const [dropdown, setDropdown] = useState({ visible: false, type: null, id: null, anchor: null });
  const [kbVisible, setKbVisible] = useState(false);
  const [kbHeight, setKbHeight] = useState(0);
  const [currentTheme, setCurrentTheme] = useState('dark');

  // ─── Refs ───
  const dropdownRefs = useRef({});
  const scrollViewRef = useRef(null);
  const scrollY = useRef(0);
  const toastTimer = useRef(null);
  const setRef = useCallback((key) => (el) => { if (el) dropdownRefs.current[key] = el; }, []);

  // ─── Get current theme colors ───
  const C = THEMES[currentTheme] || THEMES.dark;

  // ─── Keyboard Listeners ───
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", (e) => { 
      setKbVisible(true); 
      setKbHeight(e.endCoordinates.height); 
    });
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => { 
      setKbVisible(false); 
      setKbHeight(0); 
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  // ─── Load Data from Storage ───
  useEffect(() => {
    (async () => {
      try {
        const migrated = await AsyncStorage.getItem("@sp_v2_clean");
        if (!migrated) {
          try {
            await AsyncStorage.removeItem(KEYS.products);
            await AsyncStorage.removeItem(KEYS.units);
            await AsyncStorage.removeItem(KEYS.categories);
            await AsyncStorage.removeItem(KEYS.converters);
          } catch {}
          await AsyncStorage.setItem("@sp_v2_clean", "1");
        }
        
        const [p, u, c, h, cv, theme] = await Promise.all([
          dbLoad(KEYS.products, []), 
          dbLoad(KEYS.units, DEFAULT_UNITS), 
          dbLoad(KEYS.categories, []), 
          dbLoad(KEYS.history, []), 
          dbLoad(KEYS.converters, []),
          dbLoad(KEYS.theme, 'dark')
        ]);
        
        setProducts(p); 
        
        // units চেক করুন - যদি খালি হয় তাহলে DEFAULT_UNITS ব্যবহার করুন
        const loadedUnits = u && u.length > 0 ? u : DEFAULT_UNITS;
        setUnits(loadedUnits);
        
        setCategories(c); 
        setHistory(h); 
        setConverterPairs(cv);
        setCurrentTheme(theme);
        
        // প্রথম উপলব্ধ ইউনিট সিলেক্ট করুন
        const firstUnit = loadedUnits[0]?.id ?? DEFAULT_UNITS[0]?.id ?? "";
        setSelectedProduct(p[0]?.id ?? ""); 
        setSelectedUnit(firstUnit); 
        setResultUnitId(firstUnit);
        
        if (c.length > 0) setCostItems([freshCostRow(c, loadedUnits)]);
      } catch (e) {
        console.warn("DB init error:", e);
        // Error হলে ডিফল্ট ইউনিট সেট করুন
        setUnits(DEFAULT_UNITS);
        const firstUnit = DEFAULT_UNITS[0]?.id ?? "";
        setSelectedUnit(firstUnit);
        setResultUnitId(firstUnit);
      }
      setDbReady(true);
    })();
  }, []);

  // ─── Auto-save to Storage ───
  useEffect(() => { if (dbReady) dbSave(KEYS.products, products); }, [products, dbReady]);
  useEffect(() => { if (dbReady) dbSave(KEYS.units, units); }, [units, dbReady]);
  useEffect(() => { if (dbReady) dbSave(KEYS.categories, categories); }, [categories, dbReady]);
  useEffect(() => { if (dbReady) dbSave(KEYS.history, history); }, [history, dbReady]);
  useEffect(() => { if (dbReady) dbSave(KEYS.converters, converterPairs); }, [converterPairs, dbReady]);
  useEffect(() => { if (dbReady) dbSave(KEYS.theme, currentTheme); }, [currentTheme, dbReady]);

  // ─── Helper Functions ───
  const activeUnit = units.find((u) => u.id === selectedUnit) ?? units[0] ?? DEFAULT_UNITS[0];
  const resultUnit = units.find((u) => u.id === resultUnitId) ?? activeUnit;
  const isSameUnit = selectedUnit === resultUnitId;
  const rate = parseFloat(conversionRate) || 1;

  function openDropdown(type, refKey, id) {
    const ref = dropdownRefs.current[refKey];
    if (ref) { 
      ref.measureInWindow((px, py, width, height) => { 
        setDropdown({ visible: true, type, id, anchor: { px, py, width, height } }); 
      }); 
    }
  }

  function closeDropdown() { 
    setDropdown({ visible: false, type: null, id: null, anchor: null }); 
  }
  
  function handleDropdownSelect(value) {
    const { type, id } = dropdown;
    if (type === "product") { 
      setSelectedProduct(value); 
      setSellingPrice(""); 
      setCostItems([freshCostRow(categories, units)]); 
      setResult(null); 
      setConversionRate("1"); 
    }
    else if (type === "inputCurrency") { 
      setSelectedUnit(value); 
      if (isSameUnit) setResultUnitId(value); 
      setResult(null); 
    }
    else if (type === "resultCurrency") { 
      setResultUnitId(value); 
      if (value === selectedUnit) setConversionRate("1"); 
    }
    else if (type === "costCategory") { 
      updateCostRow(id, "categoryId", value); 
    }
    else if (type === "percentageRef") { 
      updateCostRow(id, "percentageRefId", value); 
    }
    else if (type === "converterFrom") { 
      updateConverterPair(id, "fromUnitId", value); 
    }
    else if (type === "converterTo") { 
      updateConverterPair(id, "toUnitId", value); 
    }
    closeDropdown();
  }
  
  function getDropdownOptions() {
    const { type, id } = dropdown;
    if (type === "product") return products.map((p) => ({ value: p.id, label: p.name }));
    if (type === "inputCurrency") return units.map((u) => ({ value: u.id, label: `${u.symbol} ${u.label}` }));
    if (type === "resultCurrency") return units.map((u) => ({ value: u.id, label: `${u.symbol} — ${u.label}` }));
    if (type === "costCategory") return categories.map((c) => ({ value: c.id, label: c.name }));
    if (type === "percentageRef") {
      return costItems
        .filter(c => c.id !== id && !c.isPercentage)
        .map(c => {
          const cat = categories.find(cat => cat.id === c.categoryId);
          return { value: c.id, label: cat?.name || 'Unknown' };
        });
    }
    if (type === "converterFrom" || type === "converterTo") {
      return units.filter((u) => u.type === "currency").map((u) => ({ value: u.id, label: `${u.symbol} ${u.label}` }));
    }
    return [];
  }
  
  function getConversions(amountStr, fromUnitId) {
    const amt = parseFloat(amountStr); 
    if (isNaN(amt) || amt === 0) return [];
    return converterPairs
      .filter((cp) => cp.fromUnitId === fromUnitId && parseFloat(cp.rate) > 0)
      .map((cp) => { 
        const u = units.find((u) => u.id === cp.toUnitId); 
        return { symbol: u?.symbol ?? "", value: amt * parseFloat(cp.rate) }; 
      })
      .filter((x) => x.symbol);
  }
  
  function convertedProfit(raw) { 
    if (resultUnit?.type === "percentage") return (raw / (result?.totalCost || 1)) * 100; 
    return raw * rate; 
  }
  
  function fmt(raw) { 
    const val = convertedProfit(raw); 
    if (resultUnit?.type === "percentage") return `${Math.abs(val).toFixed(2)}%`; 
    return `${resultUnit?.symbol}${Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; 
  }

  function newCalculation() { 
    setTitle(""); 
    setSellingPrice(""); 
    setCostItems([freshCostRow(categories, units)]); 
    setResult(null); 
    setConversionRate("1"); 
    setSellingMode("price"); 
    setTargetMargin(""); 
  }
  
  function addCostRow() { 
    setCostItems((p) => [...p, freshCostRow(categories, units)]); 
  }
  
  function removeCostRow(id) { 
    setCostItems((p) => p.filter((c) => c.id !== id)); 
  }
  
  function updateCostRow(id, field, value) { 
    setCostItems((p) => p.map((c) => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    })); 
    setResult(null); 
  }

  function togglePercentageMode(id) {
    setCostItems((p) => p.map((c) => {
      if (c.id === id) {
        const newIsPercentage = !c.isPercentage;
        return { 
          ...c, 
          isPercentage: newIsPercentage,
          percentageValue: newIsPercentage ? c.percentageValue : "",
          percentageRefId: newIsPercentage ? (c.percentageRefId || null) : null,
        };
      }
      return c;
    }));
    setResult(null);
  }

  function calculateAllAmounts(items) {
    const resultMap = {};
    const processed = new Set();
    
    items.forEach(item => {
      if (!item.isPercentage) {
        resultMap[item.id] = parseFloat(item.amount) || 0;
        processed.add(item.id);
      }
    });
    
    let changed = true;
    let maxPasses = 10;
    while (changed && maxPasses > 0) {
      changed = false;
      maxPasses--;
      
      items.forEach(item => {
        if (item.isPercentage && !processed.has(item.id)) {
          const pct = parseFloat(item.percentageValue);
          if (!isNaN(pct) && pct > 0) {
            let baseAmount = 0;
            
            if (item.percentageRefId && resultMap[item.percentageRefId] !== undefined) {
              baseAmount = resultMap[item.percentageRefId];
            } else if (!item.percentageRefId) {
              baseAmount = items
                .filter(c => !c.isPercentage)
                .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
            }
            
            if (baseAmount > 0) {
              resultMap[item.id] = (pct / 100) * baseAmount;
              processed.add(item.id);
              changed = true;
            }
          }
        }
      });
    }
    
    let total = 0;
    items.forEach(item => {
      total += resultMap[item.id] || 0;
    });
    
    return { results: resultMap, total };
  }

  function calculate() {
    const sp = parseFloat(sellingPrice); 
    if (isNaN(sp)) return;
    
    const { results, total } = calculateAllAmounts(costItems);
    
    setResult({ 
      profit: sp - total, 
      percent: total > 0 ? ((sp - total) / total) * 100 : 0, 
      totalCost: total,
      itemAmounts: results 
    });
    Keyboard.dismiss();
    setTimeout(() => { scrollViewRef.current?.scrollToEnd({ animated: true }); }, 400);
  }

  function saveCalc() {
    if (!result) return;
    const product = products.find((p) => p.id === selectedProduct);
    const itemAmounts = result.itemAmounts || {};
    
    setHistory((h) => [{ 
      id: Date.now().toString(), 
      title: title.trim() || product?.name || "Untitled", 
      productName: product?.name ?? "", 
      productId: selectedProduct, 
      unitId: selectedUnit, 
      unitSymbol: activeUnit?.symbol ?? "$", 
      sellingPrice: parseFloat(sellingPrice), 
      costItems: costItems.map((ci) => {
        const cat = categories.find((c) => c.id === ci.categoryId);
        const refCat = ci.percentageRefId ? categories.find(c => c.id === costItems.find(item => item.id === ci.percentageRefId)?.categoryId) : null;
        return {
          categoryName: cat?.name ?? ci.categoryId,
          amount: parseFloat(ci.amount) || 0,
          isPercentage: ci.isPercentage || false,
          percentageValue: ci.percentageValue || "",
          percentageRefName: refCat?.name || null,
          calculatedAmount: itemAmounts[ci.id] || 0,
        };
      }), 
      totalCost: result.totalCost, 
      profitAmount: result.profit, 
      profitPercent: result.percent, 
      resultUnitSymbol: resultUnit?.symbol ?? activeUnit?.symbol ?? "$", 
      conversionRate: rate, 
      convertedProfit: convertedProfit(result.profit), 
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) 
    }, ...h]);
    showToast("Saved to history", "green");
  }

  function loadFromHistory(h) {
    setTitle(h.title); 
    setSelectedProduct(h.productId); 
    setSelectedUnit(h.unitId); 
    setResultUnitId(h.unitId);
    setConversionRate(h.conversionRate?.toString() ?? "1"); 
    setSellingPrice(h.sellingPrice.toString());
    setCostItems(h.costItems.length > 0 ? h.costItems.map((ci, i) => {
      const cat = categories.find((c) => c.name === ci.categoryName);
      return { 
        id: `l_${i}_${Date.now()}`, 
        categoryId: cat?.id ?? categories[0]?.id ?? "", 
        amount: ci.amount?.toString() || "",
        isPercentage: ci.isPercentage || false,
        percentageValue: ci.percentageValue || "",
        percentageRefId: null,
      };
    }) : [freshCostRow(categories, units)]);
    setResult({ profit: h.profitAmount, percent: h.profitPercent, totalCost: h.totalCost }); 
    setTab("calc");
  }

  function addProduct() { 
    if (!newProductName.trim()) return; 
    const np = { id: Date.now().toString(), name: newProductName.trim() }; 
    setProducts((p) => [...p, np]); 
    setSelectedProduct(np.id); 
    setNewProductName(""); 
    setSheet(null); 
  }

  function addUnit() { 
    if (!newUnitLabel.trim() || !newUnitSymbol.trim()) return; 
    const nu = { id: Date.now().toString(), label: newUnitLabel.trim(), symbol: newUnitSymbol.trim(), type: newUnitType }; 
    setUnits((u) => [...u, nu]); 
    setSelectedUnit(nu.id); 
    setNewUnitLabel(""); 
    setNewUnitSymbol(""); 
    setSheet(null); 
  }

  function addCategory() { 
    if (!newCatName.trim()) return; 
    setCategories((c) => [...c, { id: Date.now().toString(), name: newCatName.trim() }]); 
    setNewCatName(""); 
    setSheet(null); 
  }

  function addConverterPair() { 
    setConverterPairs((p) => [...p, { 
      id: Date.now().toString(), 
      fromUnitId: units[0]?.id ?? "", 
      toUnitId: units[1]?.id ?? units[0]?.id ?? "", 
      rate: "" 
    }]); 
  }

  function removeConverterPair(id) { 
    setConverterPairs((p) => p.filter((x) => x.id !== id)); 
  }

  function updateConverterPair(id, field, value) { 
    setConverterPairs((p) => p.map((x) => (x.id === id ? { ...x, [field]: value } : x))); 
  }

  function deleteHistory(id) { 
    setHistory((h) => h.filter((x) => x.id !== id)); 
    showToast("Deleted from history", "red"); 
  }

  function toggleTheme() {
    setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark');
    showToast(`Theme changed to ${currentTheme === 'dark' ? 'Light' : 'Dark'}`, 'green');
  }

  function showToast(message, type) { 
    if (toastTimer.current) clearTimeout(toastTimer.current); 
    setToast({ message, type }); 
    toastTimer.current = setTimeout(() => setToast(null), 2000); 
  }

  function renderConvBadges(amountStr) { 
    const convs = getConversions(amountStr, selectedUnit); 
    if (convs.length === 0) return null; 
    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "50%", gap: 2 }}>
        {convs.map((cv, i) => (
          <ConvBadge 
            key={i} 
            symbol={cv.symbol} 
            value={cv.value} 
            color={C.blue} 
            theme={C} 
          />
        ))}
      </View>
    ); 
  }

  const isLoss = result !== null && result.profit < 0;
  const accentColor = isLoss ? C.red : C.green;
  
  const { results, total } = calculateAllAmounts(costItems);
  const totalCostLive = total;

  const suggestedPrice = sellingMode === "margin" && targetMargin !== "" && totalCostLive > 0 
    ? totalCostLive * (1 + parseFloat(targetMargin) / 100) 
    : null;
  
  function applyTargetMargin() {
    if (suggestedPrice === null) return;
    setSellingPrice(suggestedPrice.toFixed(2)); 
    setSellingMode("price"); 
    setTargetMargin("");
    const { results, total } = calculateAllAmounts(costItems);
    const profit = suggestedPrice - total;
    setResult({ profit, percent: total > 0 ? (profit / total) * 100 : 0, totalCost: total, itemAmounts: results });
    Keyboard.dismiss();
    setTimeout(() => { scrollViewRef.current?.scrollToEnd({ animated: true }); }, 400);
  }

  // ─── Loading Screen ───
  if (!dbReady) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={C.blue} />
        <Text style={{ color: C.muted, fontSize: 12, fontFamily: MONO, marginTop: 12 }}>Loading data...</Text>
      </SafeAreaView>
    );
  }

  // ─── Main Render ───
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: SAFE_TOP + 8, backgroundColor: C.bg }]}>
        <View>
          <Text style={[s.headerSub, { color: C.muted }]}>SmartProfit</Text>
          <Text style={[s.headerTitle, { color: C.text }]}>Calculator</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {tab === "calc" && (
            <TouchableOpacity onPress={newCalculation} style={[s.plusBtn, { backgroundColor: C.blue }]}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginTop: -1 }}>+</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={toggleTheme} style={[s.iconBtn, { backgroundColor: C.surface2, borderColor: C.border }]}>
            <Text style={{ fontSize: 14 }}>{currentTheme === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[s.tabs, { backgroundColor: C.bg }]}>
        {["calc", "history", "manage"].map((t) => (
          <TouchableOpacity 
            key={t} 
            onPress={() => setTab(t)} 
            style={[s.tabBtn, { backgroundColor: C.surface }, tab === t && { backgroundColor: C.blue }]}
          >
            <Text style={[s.tabText, { color: tab === t ? "#fff" : C.muted }]}>
              {t === "calc" ? "Calculator" : t === "history" ? "History" : "Manage"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Calculator Tab */}
      {tab === "calc" && (
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, backgroundColor: C.bg }}
          contentContainerStyle={[s.scrollContent, { paddingBottom: kbVisible ? kbHeight + 40 : 36 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
        >
          {/* Title Card */}
          <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={s.cardInner}>
              <Text style={[s.label, { color: C.muted }]}>Title (optional)</Text>
              <KBInput 
                scrollRef={scrollViewRef} 
                placeholder="e.g. June Batch — iPhone 15" 
                placeholderTextColor={C.border} 
                value={title} 
                onChangeText={setTitle} 
                style={[s.titleInput, { color: C.text }]} 
              />
            </View>
          </View>

          {/* Product & Currency */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }} ref={setRef("product")} collapsable={false}>
              <DropdownButton 
                label="Product" 
                value={selectedProduct} 
                options={products.map((p) => ({ value: p.id, label: p.name }))} 
                onPress={() => openDropdown("product", "product")} 
                onAdd={() => setSheet("product")} 
                theme={C} 
              />
            </View>
            <View style={{ flex: 1 }} ref={setRef("inputCurrency")} collapsable={false}>
              <DropdownButton 
                label="Input Currency" 
                value={selectedUnit} 
                options={units.map((u) => ({ value: u.id, label: `${u.symbol} ${u.label}` }))} 
                onPress={() => openDropdown("inputCurrency", "inputCurrency")} 
                onAdd={() => setSheet("unit")} 
                theme={C} 
                showAdd={false}
              />
            </View>
          </View>

          {/* Currency Converter */}
          <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[s.label, { color: C.muted }]}>Currency Converter</Text>
                <Text style={[s.hint, { color: C.muted }]}>Auto-converts cost rows to target currencies</Text>
              </View>
              <TouchableOpacity onPress={addConverterPair} style={s.addPill}>
                <Text style={[s.addPillText, { color: C.blue }]}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {converterPairs.length === 0 ? (
              <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
                <Text style={{ fontSize: 9, color: C.border, fontFamily: MONO, fontStyle: "italic" }}>
                  No converters yet. Tap + Add to set rates.
                </Text>
              </View>
            ) : converterPairs.map((cp, idx) => {
              const fromU = units.find((u) => u.id === cp.fromUnitId); 
              const toU = units.find((u) => u.id === cp.toUnitId);
              return (
                <View key={cp.id} style={[s.converterRow, idx > 0 && { borderTopColor: C.border }]}>
                  <Text style={[s.converterOne, { color: C.muted }]}>1</Text>
                  <TouchableOpacity 
                    ref={setRef(`cf_${cp.id}`)} 
                    collapsable={false} 
                    onPress={() => openDropdown("converterFrom", `cf_${cp.id}`, cp.id)} 
                    style={[s.miniSelect, { backgroundColor: C.surface2, borderColor: C.border }]}
                  >
                    <Text style={[s.miniSelectText, { color: C.text }]} numberOfLines={1}>
                      {fromU?.symbol} {fromU?.label}
                    </Text>
                    <Text style={[s.chevron, { color: C.muted }]}>▼</Text>
                  </TouchableOpacity>
                  <Text style={[s.converterEq, { color: C.muted }]}>=</Text>
                  <KBInput 
                    scrollRef={scrollViewRef} 
                    keyboardType="decimal-pad" 
                    placeholder="0.00" 
                    placeholderTextColor={C.border} 
                    value={cp.rate} 
                    onChangeText={(v) => updateConverterPair(cp.id, "rate", v)} 
                    style={[s.converterInput, { backgroundColor: C.surface2, borderColor: "rgba(74,124,255,0.3)", color: C.text }]} 
                  />
                  <TouchableOpacity 
                    ref={setRef(`ct_${cp.id}`)} 
                    collapsable={false} 
                    onPress={() => openDropdown("converterTo", `ct_${cp.id}`, cp.id)} 
                    style={[s.miniSelect, { flex: 1, backgroundColor: C.surface2, borderColor: C.border }]}
                  >
                    <Text style={[s.miniSelectText, { color: C.text }]} numberOfLines={1}>
                      {toU?.symbol} {toU?.label}
                    </Text>
                    <Text style={[s.chevron, { color: C.muted }]}>▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeConverterPair(cp.id)} style={s.removeBtn}>
                    <Text style={{ color: C.muted, fontSize: 11 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Cost Breakdown */}
          <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={s.sectionHeader}>
              <Text style={[s.label, { color: C.muted }]}>Cost Breakdown</Text>
              <TouchableOpacity onPress={() => setSheet("category")}>
                <Text style={{ fontSize: 10, color: C.blue, fontWeight: "600", fontFamily: MONO }}>+ Category</Text>
              </TouchableOpacity>
            </View>
            {costItems.map((ci, idx) => {
              const catName = categories.find((c) => c.id === ci.categoryId)?.name ?? "Select";
              const isPct = ci.isPercentage;
              const calculatedAmt = results[ci.id] || 0;
              const refName = ci.percentageRefId 
                ? categories.find(c => c.id === costItems.find(item => item.id === ci.percentageRefId)?.categoryId)?.name 
                : null;
              const convBadges = renderConvBadges(ci.amount);
              
              return (
                <View key={ci.id} style={[s.costRow, idx > 0 && { borderTopColor: C.border }]}>
                  <View style={s.costCatRow}>
                    <TouchableOpacity 
                      ref={setRef(`cc_${ci.id}`)} 
                      collapsable={false} 
                      onPress={() => openDropdown("costCategory", `cc_${ci.id}`, ci.id)} 
                      style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
                    >
                      <Text style={{ color: C.text, fontSize: 13, fontWeight: "600", flex: 1 }}>{catName}</Text>
                      <Text style={[s.chevron, { color: C.muted, marginRight: 6 }]}>▼</Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <TouchableOpacity 
                        onPress={() => togglePercentageMode(ci.id)} 
                        style={{ 
                          backgroundColor: isPct ? 'rgba(45,212,160,0.2)' : 'rgba(74,124,255,0.15)',
                          borderRadius: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          marginRight: 8,
                          borderWidth: 1,
                          borderColor: isPct ? 'rgba(45,212,160,0.3)' : 'rgba(74,124,255,0.2)',
                        }}
                      >
                        <Text style={{ 
                          fontSize: 9, 
                          color: isPct ? C.green : C.blue, 
                          fontFamily: MONO, 
                          fontWeight: "700" 
                        }}>
                          {isPct ? '%' : '$'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeCostRow(ci.id)} style={s.removeBtn}>
                        <Text style={{ color: C.muted, fontSize: 11 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {isPct ? (
                    <View style={[s.inputRow, { flexDirection: 'column', alignItems: 'stretch', gap: 6, backgroundColor: C.surface2, borderColor: C.border }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: C.green, fontFamily: MONO, fontWeight: "700", fontSize: 12 }}>%</Text>
                        <KBInput 
                          scrollRef={scrollViewRef} 
                          keyboardType="decimal-pad" 
                          placeholder="0.00" 
                          placeholderTextColor={C.border} 
                          value={ci.percentageValue} 
                          onChangeText={(v) => {
                            setCostItems(p => p.map(c => c.id === ci.id ? { ...c, percentageValue: v } : c));
                            setResult(null);
                          }} 
                          style={[s.amountInput, { color: C.green }]} 
                        />
                        <Text style={{ fontSize: 9, color: C.muted, fontFamily: MONO }}>% of</Text>
                      </View>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 9, color: C.muted, fontFamily: MONO, marginRight: 6 }}>Based on:</Text>
                        <TouchableOpacity 
                          ref={setRef(`pr_${ci.id}`)} 
                          collapsable={false} 
                          onPress={() => openDropdown("percentageRef", `pr_${ci.id}`, ci.id)} 
                          style={{ 
                            flex: 1, 
                            backgroundColor: C.surface, 
                            borderRadius: 6, 
                            paddingHorizontal: 8, 
                            paddingVertical: 4,
                            borderWidth: 1,
                            borderColor: C.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Text style={{ color: C.text, fontSize: 11, fontFamily: MONO }}>
                            {refName || 'All Costs'}
                          </Text>
                          <Text style={[s.chevron, { color: C.muted, marginLeft: 4 }]}>▼</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {calculatedAmt > 0 && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                          <Text style={{ fontSize: 9, color: C.muted, fontFamily: MONO }}>
                            = {activeUnit?.symbol}{calculatedAmt.toFixed(2)}
                          </Text>
                          {renderConvBadges(calculatedAmt.toString())}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={[s.inputRow, { backgroundColor: C.surface2, borderColor: C.border }]}>
                      <Text style={[s.currencySymbol, { color: C.red }]}>{activeUnit?.symbol || '$'}</Text>
                      <KBInput 
                        scrollRef={scrollViewRef} 
                        keyboardType="decimal-pad" 
                        placeholder="0.00" 
                        placeholderTextColor={C.border} 
                        value={ci.amount} 
                        onChangeText={(v) => updateCostRow(ci.id, "amount", v)} 
                        style={[s.amountInput, { color: C.text }]} 
                      />
                      {convBadges}
                    </View>
                  )}
                </View>
              );
            })}
            <View style={[s.costFooter, { borderTopColor: C.border }]}>
              <TouchableOpacity onPress={addCostRow} style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: C.blue, fontSize: 14, marginRight: 3 }}>+</Text>
                <Text style={{ color: C.blue, fontSize: 11, fontWeight: "600" }}>Add Cost Row</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Text style={{ fontSize: 11, fontFamily: MONO, color: C.textSub }}>Total: </Text>
                <Text style={{ fontSize: 11, fontFamily: MONO, color: C.red, fontWeight: "700" }}>
                  {activeUnit?.symbol}{totalCostLive.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                {renderConvBadges(totalCostLive.toString())}
              </View>
            </View>
          </View>

          {/* Selling Price */}
          <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[s.label, { color: C.muted }]}>Selling Price</Text>
              <View style={{ flexDirection: "row", borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: C.border }}>
                <TouchableOpacity 
                  onPress={() => { setSellingMode("price"); setTargetMargin(""); }} 
                  style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: sellingMode === "price" ? C.blue : "transparent" }}
                >
                  <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: "600", letterSpacing: 0.5, color: sellingMode === "price" ? "#fff" : C.muted }}>Enter Price</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => { setSellingMode("margin"); setResult(null); }} 
                  style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: sellingMode === "margin" ? C.green : "transparent" }}
                >
                  <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: "600", letterSpacing: 0.5, color: sellingMode === "margin" ? "#fff" : C.muted }}>Set Target %</Text>
                </TouchableOpacity>
              </View>
            </View>
            {sellingMode === "price" ? (
              <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: C.green, fontFamily: MONO, fontWeight: "700", fontSize: 16 }}>{activeUnit?.symbol}</Text>
                  <KBInput 
                    scrollRef={scrollViewRef} 
                    keyboardType="decimal-pad" 
                    placeholder="0.00" 
                    placeholderTextColor={C.border} 
                    value={sellingPrice} 
                    onChangeText={(v) => { setSellingPrice(v); setResult(null); }} 
                    style={{ flex: 1, color: C.text, fontFamily: MONO, fontWeight: "600", fontSize: 20, padding: 0, marginLeft: 6 }} 
                  />
                  {renderConvBadges(sellingPrice)}
                </View>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: "rgba(45,212,160,0.35)", paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 }}>
                  <Text style={{ color: C.muted, fontSize: 11, fontFamily: MONO }}>Desired Profit</Text>
                  <KBInput 
                    scrollRef={scrollViewRef} 
                    keyboardType="decimal-pad" 
                    placeholder="e.g. 25" 
                    placeholderTextColor={C.border} 
                    value={targetMargin} 
                    onChangeText={(v) => { setTargetMargin(v); setResult(null); }} 
                    style={{ flex: 1, color: C.text, fontFamily: MONO, fontWeight: "700", fontSize: 18, padding: 0, textAlign: "right" }} 
                  />
                  <Text style={{ color: C.green, fontFamily: MONO, fontWeight: "700", fontSize: 16 }}>%</Text>
                </View>
                {suggestedPrice !== null && totalCostLive > 0 ? (
                  <View style={{ borderRadius: 10, borderWidth: 1, borderColor: "rgba(45,212,160,0.3)", backgroundColor: "rgba(45,212,160,0.04)", paddingHorizontal: 14, paddingVertical: 12 }}>
                    <Text style={{ fontSize: 8, fontFamily: MONO, letterSpacing: 1.2, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>Suggested Selling Price</Text>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                      <Text style={{ color: C.green, fontFamily: MONO, fontWeight: "700", fontSize: 13 }}>{activeUnit?.symbol}</Text>
                      <Text style={{ color: C.green, fontWeight: "700", fontSize: 28 }}>
                        {suggestedPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <Text style={{ fontSize: 9, fontFamily: MONO, color: C.muted }}>Cost: {activeUnit?.symbol}{totalCostLive.toFixed(2)}</Text>
                      <Text style={{ fontSize: 9, fontFamily: MONO, color: C.green, fontWeight: "600" }}>
                        +{activeUnit?.symbol}{(suggestedPrice - totalCostLive).toFixed(2)} profit
                      </Text>
                    </View>
                    <TouchableOpacity onPress={applyTargetMargin} activeOpacity={0.85} style={{ backgroundColor: C.green, borderRadius: 8, paddingVertical: 10, alignItems: "center" }}>
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700", fontFamily: MONO, letterSpacing: 1.5, textTransform: "uppercase" }}>Apply & Calculate →</Text>
                    </TouchableOpacity>
                  </View>
                ) : targetMargin !== "" && totalCostLive === 0 ? (
                  <Text style={{ fontSize: 9, fontFamily: MONO, color: C.muted, fontStyle: "italic", textAlign: "center", paddingVertical: 4 }}>
                    Add cost items first to calculate suggested price.
                  </Text>
                ) : null}
              </View>
            )}
          </View>

          {sellingMode === "price" && (
            <TouchableOpacity onPress={calculate} activeOpacity={0.85} style={[s.calcBtn, { backgroundColor: C.blue }]}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.5 }}>Calculate Profit</Text>
            </TouchableOpacity>
          )}

          {/* Result */}
          {result !== null && (
            <View style={[s.card, { backgroundColor: C.surface, borderColor: isLoss ? "rgba(240,96,96,0.25)" : "rgba(45,212,160,0.25)" }]}>
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <Text style={[s.label, { color: C.muted }]}>Result</Text>
                  <View style={{ backgroundColor: isLoss ? "rgba(240,96,96,0.1)" : "rgba(45,212,160,0.1)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: "700", color: accentColor }}>{isLoss ? "LOSS" : "PROFIT"}</Text>
                  </View>
                </View>
                <Text style={[s.label, { color: C.muted, marginBottom: 6 }]}>Show Profit As</Text>
                <View style={{ flexDirection: "row", gap: 6, marginBottom: 14 }}>
                  {["amount", "percent", "both"].map((v) => (
                    <TouchableOpacity 
                      key={v} 
                      onPress={() => setProfitView(v)} 
                      style={[s.toggleBtn, { borderColor: C.border, backgroundColor: C.surface2 }, profitView === v && { backgroundColor: C.blue, borderColor: C.blue }]}
                    >
                      <Text style={[s.toggleText, { color: C.textSub }, profitView === v && { color: "#fff" }]}>
                        {v === "amount" ? "Amount" : v === "percent" ? "%" : "Both"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[s.label, { color: C.muted, marginBottom: 6 }]}>Result Currency</Text>
                <TouchableOpacity 
                  ref={setRef("resultCurrency")} 
                  collapsable={false} 
                  onPress={() => openDropdown("resultCurrency", "resultCurrency")} 
                  style={[s.inputRow, { backgroundColor: C.surface2, borderColor: C.border, marginBottom: 14 }]}
                >
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: "600", flex: 1 }}>
                    {resultUnit?.symbol} — {resultUnit?.label}
                  </Text>
                  <Text style={[s.chevron, { color: C.muted }]}>▼</Text>
                </TouchableOpacity>
                {!isSameUnit && resultUnit?.type !== "percentage" && activeUnit?.type !== "percentage" && (
                  <>
                    <Text style={[s.label, { color: C.muted, marginBottom: 6 }]}>Exchange Rate</Text>
                    <View style={[s.inputRow, { backgroundColor: C.surface2, borderColor: "rgba(74,124,255,0.4)", marginBottom: 14 }]}>
                      <Text style={{ color: C.muted, fontSize: 11, fontFamily: MONO }}>1 {activeUnit?.symbol} =</Text>
                      <KBInput 
                        scrollRef={scrollViewRef} 
                        keyboardType="decimal-pad" 
                        placeholder="1.00" 
                        placeholderTextColor={C.border} 
                        value={conversionRate} 
                        onChangeText={setConversionRate} 
                        style={{ flex: 1, color: C.text, fontFamily: MONO, fontWeight: "600", fontSize: 14, padding: 0, marginLeft: 6 }} 
                      />
                      <Text style={{ color: C.blue, fontFamily: MONO, fontWeight: "700", fontSize: 12 }}>{resultUnit?.symbol}</Text>
                    </View>
                  </>
                )}
                <View style={[s.divider, { borderTopColor: C.border }]} />
                <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 16 }}>
                  {(profitView === "amount" || profitView === "both") && (
                    <View>
                      <Text style={[s.resultSubLabel, { color: C.textSub }]}>
                        {!isSameUnit ? `Amount (${resultUnit?.symbol})` : "Amount"}
                      </Text>
                      <Text style={{ fontSize: 28, fontWeight: "700", color: accentColor }}>{fmt(result.profit)}</Text>
                    </View>
                  )}
                  {(profitView === "percent" || profitView === "both") && (
                    <View style={profitView === "both" ? { marginLeft: "auto", alignItems: "flex-end" } : {}}>
                      <Text style={[s.resultSubLabel, { color: C.textSub }]}>Margin</Text>
                      <Text style={{ fontSize: 20, fontFamily: MONO, fontWeight: "700", color: accentColor }}>
                        {result.percent >= 0 ? "+" : ""}{result.percent.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[s.summaryBox, { backgroundColor: C.surface2 }]}>
                  <View style={s.summaryRow}>
                    <Text style={[s.summaryLabel, { color: C.textSub }]}>Selling Price</Text>
                    <Text style={[s.summaryVal, { color: C.textSub }]}>{activeUnit?.symbol}{parseFloat(sellingPrice).toFixed(2)}</Text>
                  </View>
                  {costItems.map((ci) => {
                    const cat = categories.find((c) => c.id === ci.categoryId);
                    const calculatedAmt = results[ci.id] || 0;
                    if (calculatedAmt === 0 && !ci.isPercentage) return null;
                    const displayAmount = ci.isPercentage && ci.percentageValue 
                      ? `${ci.percentageValue}%`
                      : parseFloat(ci.amount)?.toFixed(2) || '0';
                    const refName = ci.percentageRefId 
                      ? categories.find(c => c.id === costItems.find(item => item.id === ci.percentageRefId)?.categoryId)?.name 
                      : 'All Costs';
                    return (
                      <View key={ci.id} style={s.summaryRow}>
                        <Text style={[s.summaryLabel, { color: C.muted }]}>
                          {cat?.name || 'Unknown'} 
                          {ci.isPercentage && ci.percentageValue ? ` (${ci.percentageValue}% of ${refName})` : ''}
                        </Text>
                        <Text style={[s.summaryVal, { color: C.textSub }]}>
                          {ci.isPercentage && ci.percentageValue 
                            ? `−${activeUnit?.symbol}${calculatedAmt.toFixed(2)}`
                            : `−${activeUnit?.symbol}${displayAmount}`}
                        </Text>
                      </View>
                    );
                  })}
                  <View style={[s.summaryRow, { borderTopColor: C.border, paddingTop: 6 }]}>
                    <Text style={[s.summaryLabel, { color: C.textSub }]}>Total Cost</Text>
                    <Text style={[s.summaryVal, { color: C.red }]}>−{activeUnit?.symbol}{result.totalCost.toFixed(2)}</Text>
                  </View>
                  <View style={[s.summaryRow, { borderTopColor: C.border, paddingTop: 6 }]}>
                    <Text style={[s.summaryLabel, { fontWeight: "700", color: accentColor }]}>
                      {isLoss ? "Net Loss" : "Net Profit"}{!isSameUnit ? ` (${resultUnit?.symbol})` : ""}
                    </Text>
                    <Text style={[s.summaryVal, { fontWeight: "700", color: accentColor }]}>{fmt(result.profit)}</Text>
                  </View>
                  {!isSameUnit && resultUnit?.type !== "percentage" && (
                    <Text style={{ fontSize: 8, fontFamily: MONO, color: C.muted, textAlign: "right", marginTop: 4 }}>
                      Rate: 1{activeUnit?.symbol} = {rate}{resultUnit?.symbol}
                    </Text>
                  )}
                </View>
                <View style={[s.progressTrack, { backgroundColor: C.surface2 }]}>
                  <View style={[s.progressFill, { width: `${Math.min(Math.abs(result.percent), 100)}%`, backgroundColor: accentColor }]} />
                </View>
                <TouchableOpacity onPress={saveCalc} style={[s.saveBtn, { borderColor: C.border }]}>
                  <Text style={{ color: C.textSub, fontSize: 13, fontWeight: "500" }}>Save to History</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={s.scrollContent}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: C.muted, fontSize: 11, fontFamily: MONO }}>{history.length} saved</Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={() => { setHistory([]); showToast("All history cleared", "red"); }}>
                <Text style={{ fontSize: 11, color: C.red, fontWeight: "500" }}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          {history.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 80 }}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📜</Text>
              <Text style={{ color: C.muted, fontSize: 13 }}>No saved calculations yet</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {history.map((h) => {
                const loss = h.profitAmount < 0; 
                const ac = loss ? C.red : C.green;
                const dp = h.resultUnitSymbol !== h.unitSymbol 
                  ? `${h.resultUnitSymbol}${Math.abs(h.convertedProfit).toFixed(2)}` 
                  : `${h.unitSymbol}${Math.abs(h.profitAmount).toFixed(2)}`;
                return (
                  <View key={h.id} style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                    <View style={{ padding: 12, paddingBottom: 8 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                        <View style={{ flex: 1, marginRight: 6 }}>
                          <Text style={{ fontWeight: "600", fontSize: 13, color: C.text }} numberOfLines={1}>{h.title}</Text>
                          <Text style={{ fontSize: 9, fontFamily: MONO, color: C.muted, marginTop: 2 }}>{h.productName} · {h.date}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View style={{ backgroundColor: loss ? "rgba(240,96,96,0.1)" : "rgba(45,212,160,0.1)", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: "700", color: ac }}>{loss ? "LOSS" : "PROFIT"}</Text>
                          </View>
                          <TouchableOpacity onPress={() => deleteHistory(h.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={{ color: C.muted, fontSize: 11 }}>🗑</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    <View style={{ paddingHorizontal: 12, paddingBottom: 8, flexDirection: "row" }}>
                      {[
                        { l: "Sell", v: `${h.unitSymbol}${h.sellingPrice.toFixed(2)}` },
                        { l: "Cost", v: `${h.unitSymbol}${h.totalCost.toFixed(2)}` },
                        { l: "Profit", v: dp, c: ac, b: true },
                        { l: "Margin", v: `${h.profitPercent >= 0 ? "+" : ""}${h.profitPercent.toFixed(1)}%`, c: ac, b: true, r: true },
                      ].map((x, i) => (
                        <View key={i} style={{ flex: 1, alignItems: x.r ? "flex-end" : "flex-start" }}>
                          <Text style={{ fontSize: 8, fontFamily: MONO, color: C.muted, textTransform: "uppercase", marginBottom: 2 }}>{x.l}</Text>
                          <Text style={{ fontFamily: MONO, fontSize: 11, fontWeight: x.b ? "700" : "400", color: x.c || C.text }}>{x.v}</Text>
                        </View>
                      ))}
                    </View>
                    {h.costItems && h.costItems.length > 0 && (
                      <View style={{ paddingHorizontal: 12, paddingBottom: 8, flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                        {h.costItems.map((ci, i) => (
                          <View key={i} style={{ backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text style={{ fontSize: 8, fontFamily: MONO, color: C.muted }}>
                              {ci.categoryName}: {ci.isPercentage ? `${ci.percentageValue || '0'}%` : `${h.unitSymbol}${ci.amount?.toFixed(2) || '0'}`}
                              {ci.isPercentage && ci.calculatedAmount ? ` (≈${h.unitSymbol}${ci.calculatedAmount.toFixed(2)})` : ''}
                              {ci.percentageRefName ? ` of ${ci.percentageRefName}` : ''}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <TouchableOpacity onPress={() => loadFromHistory(h)} style={[s.loadBtn, { borderTopColor: C.border }]}>
                      <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: "600", color: C.blue, letterSpacing: 1.5, textTransform: "uppercase" }}>Load & Edit →</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Manage Tab */}
      {tab === "manage" && (
        <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={[s.scrollContent, { gap: 20 }]}>
          <ManageList 
            title="Products" 
            items={products.map((p) => ({ id: p.id, name: p.name, sub: "" }))} 
            onDelete={(id) => setProducts((p) => p.filter((x) => x.id !== id))} 
            onAdd={() => setSheet("product")} 
            theme={C} 
          />
          <ManageList 
            title="Currency List" 
            items={units.filter((u) => u.type === "currency").map((u) => ({ id: u.id, name: u.label, sub: `${u.symbol} · ${u.id.toUpperCase()}` }))} 
            onDelete={(id) => setUnits((u) => u.filter((x) => x.id !== id))} 
            onAdd={() => setSheet("unit")} 
            theme={C} 
            hideAdd={false}
          />
          <ManageList 
            title="Cost Categories" 
            items={categories.map((c) => ({ id: c.id, name: c.name, sub: "" }))} 
            onDelete={(id) => setCategories((c) => c.filter((x) => x.id !== id))} 
            onAdd={() => setSheet("category")} 
            theme={C} 
          />
          
          {/* Theme Toggle in Manage */}
          <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border, padding: 16 }]}>
            <Text style={[s.label, { color: C.muted, marginBottom: 12 }]}>Appearance</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: C.text, fontSize: 14, fontWeight: "500" }}>
                {currentTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Text>
              <TouchableOpacity 
                onPress={toggleTheme} 
                style={{ 
                  flexDirection: "row", 
                  alignItems: "center", 
                  gap: 8,
                  backgroundColor: C.surface2,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: C.border
                }}
              >
                <Text style={{ fontSize: 16 }}>{currentTheme === 'dark' ? '☀️' : '🌙'}</Text>
                <Text style={{ color: C.text, fontSize: 12, fontFamily: MONO }}>
                  {currentTheme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Popup Dropdown */}
      <PopupDropdown 
        visible={dropdown.visible} 
        onClose={closeDropdown} 
        options={getDropdownOptions()} 
        onSelect={handleDropdownSelect} 
        anchorLayout={dropdown.anchor} 
        theme={C} 
      />

      {/* Add Modal */}
      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => { Keyboard.dismiss(); setSheet(null); }} />
            <View style={[s.sheetContainer, { backgroundColor: C.surface, borderTopColor: C.border }]}>
              <View style={[s.sheetHandle, { backgroundColor: C.border }]} />
              {sheet === "product" && (
                <>
                  <Text style={[s.label, { color: C.muted }]}>New Product</Text>
                  <Text style={[s.sheetH2, { color: C.text }]}>Add Product</Text>
                  <Text style={[s.fieldLabel, { color: C.muted }]}>Product Name</Text>
                  <TextInput 
                    autoFocus 
                    placeholder="e.g. iPhone 15 Pro Max" 
                    placeholderTextColor={C.muted} 
                    value={newProductName} 
                    onChangeText={setNewProductName} 
                    onSubmitEditing={addProduct} 
                    returnKeyType="done" 
                    style={[s.sheetInput, { backgroundColor: C.surface2, borderColor: C.border, color: C.text }]} 
                  />
                  <TouchableOpacity 
                    onPress={addProduct} 
                    disabled={!newProductName.trim()} 
                    style={[s.sheetSaveBtn, { backgroundColor: C.blue }, !newProductName.trim() && { opacity: 0.4 }]}
                  >
                    <Text style={s.sheetSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                </>
              )}
              {sheet === "unit" && (
                <>
                  <Text style={[s.label, { color: C.muted }]}>New Unit</Text>
                  <Text style={[s.sheetH2, { color: C.text }]}>Add Currency / Unit</Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.fieldLabel, { color: C.muted }]}>Label</Text>
                      <TextInput 
                        autoFocus 
                        placeholder="US Dollar" 
                        placeholderTextColor={C.muted} 
                        value={newUnitLabel} 
                        onChangeText={setNewUnitLabel} 
                        returnKeyType="next" 
                        style={[s.sheetInput, { backgroundColor: C.surface2, borderColor: C.border, color: C.text }]} 
                      />
                    </View>
                    <View style={{ width: 72 }}>
                      <Text style={[s.fieldLabel, { color: C.muted }]}>Symbol</Text>
                      <TextInput 
                        placeholder="$" 
                        placeholderTextColor={C.muted} 
                        value={newUnitSymbol} 
                        onChangeText={setNewUnitSymbol} 
                        returnKeyType="done" 
                        style={[s.sheetInput, { textAlign: "center", fontFamily: MONO, backgroundColor: C.surface2, borderColor: C.border, color: C.text }]} 
                      />
                    </View>
                  </View>
                  <Text style={[s.fieldLabel, { color: C.muted }]}>Type</Text>
                  <View style={{ flexDirection: "row", gap: 6, marginBottom: 14 }}>
                    {["currency", "percentage"].map((t) => (
                      <TouchableOpacity 
                        key={t} 
                        onPress={() => setNewUnitType(t)} 
                        style={[s.toggleBtn, { borderColor: C.border, backgroundColor: C.surface2 }, newUnitType === t && { backgroundColor: C.blue, borderColor: C.blue }]}
                      >
                        <Text style={[s.toggleText, { color: C.textSub }, newUnitType === t && { color: "#fff" }]}>
                          {t === "currency" ? "💱 Currency" : "% Percentage"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity 
                    onPress={addUnit} 
                    disabled={!newUnitLabel.trim() || !newUnitSymbol.trim()} 
                    style={[s.sheetSaveBtn, { backgroundColor: C.blue }, (!newUnitLabel.trim() || !newUnitSymbol.trim()) && { opacity: 0.4 }]}
                  >
                    <Text style={s.sheetSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                </>
              )}
              {sheet === "category" && (
                <>
                  <Text style={[s.label, { color: C.muted }]}>New Category</Text>
                  <Text style={[s.sheetH2, { color: C.text }]}>Add Cost Category</Text>
                  <Text style={[s.fieldLabel, { color: C.muted }]}>Category Name</Text>
                  <TextInput 
                    autoFocus 
                    placeholder="e.g. Customs Duty" 
                    placeholderTextColor={C.muted} 
                    value={newCatName} 
                    onChangeText={setNewCatName} 
                    onSubmitEditing={addCategory} 
                    returnKeyType="done" 
                    style={[s.sheetInput, { backgroundColor: C.surface2, borderColor: C.border, color: C.text }]} 
                  />
                  <TouchableOpacity 
                    onPress={addCategory} 
                    disabled={!newCatName.trim()} 
                    style={[s.sheetSaveBtn, { backgroundColor: C.blue }, !newCatName.trim() && { opacity: 0.4 }]}
                  >
                    <Text style={s.sheetSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                </>
              )}
              {Platform.OS === "ios" && <View style={{ height: 20 }} />}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Toast */}
      {toast && (
        <View style={{ 
          position: "absolute", 
          bottom: 40, 
          left: 20, 
          right: 20, 
          backgroundColor: toast.type === "green" ? C.green : C.red, 
          borderRadius: 12, 
          paddingVertical: 12, 
          paddingHorizontal: 16, 
          flexDirection: "row", 
          alignItems: "center", 
          gap: 8, 
          elevation: 8, 
          shadowColor: "#000", 
          shadowOffset: { width: 0, height: 4 }, 
          shadowOpacity: 0.3, 
          shadowRadius: 8 
        }}>
          <Text style={{ fontSize: 16 }}>{toast.type === "green" ? "✓" : "🗑"}</Text>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 }}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───
const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerSub: { fontSize: 9, fontFamily: MONO, letterSpacing: 2, textTransform: "uppercase" },
  headerTitle: { fontSize: 22, fontWeight: "700", marginTop: 1 },
  tabs: { flexDirection: "row", paddingHorizontal: 16, gap: 4, marginBottom: 10 },
  tabBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  tabText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 36, gap: 8 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardInner: { paddingHorizontal: 12, paddingVertical: 10 },
  label: { fontSize: 9, fontFamily: MONO, letterSpacing: 1.2, textTransform: "uppercase" },
  hint: { fontSize: 8, fontFamily: MONO, marginTop: 1 },
  dropdownHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingTop: 8 },
  dropdownValue: { paddingHorizontal: 10, paddingBottom: 8, paddingTop: 3, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chevron: { fontSize: 8 },
  sectionHeader: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  borderTop: { borderTopWidth: 1 },
  plusBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", elevation: 4, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  addPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  addPillText: { fontSize: 9, fontWeight: "700", fontFamily: MONO },
  removeBtn: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  calcBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", elevation: 4, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8 },
  saveBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  loadBtn: { paddingVertical: 8, borderTopWidth: 1, alignItems: "center" },
  toggleBtn: { flex: 1, paddingVertical: 5, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  toggleText: { fontSize: 11, fontWeight: "600" },
  titleInput: { fontWeight: "600", fontSize: 13, padding: 0, marginTop: 3 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1 },
  currencySymbol: { fontFamily: MONO, fontWeight: "700", fontSize: 13 },
  amountInput: { flex: 1, fontFamily: MONO, fontWeight: "600", fontSize: 14, padding: 0, marginLeft: 6 },
  converterRow: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 5 },
  converterOne: { fontSize: 9, fontFamily: MONO },
  converterEq: { fontSize: 9, fontFamily: MONO },
  converterInput: { width: 56, borderWidth: 1, borderRadius: 6, fontFamily: MONO, fontWeight: "700", fontSize: 11, paddingHorizontal: 4, paddingVertical: 5, textAlign: "center" },
  miniSelect: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 2, width: 72 },
  miniSelectText: { fontSize: 10, fontFamily: MONO, fontWeight: "700", flex: 1 },
  costRow: { paddingHorizontal: 12, paddingVertical: 8 },
  costCatRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  costFooter: { paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultSubLabel: { fontSize: 9, marginBottom: 3 },
  divider: { borderTopWidth: 1, marginBottom: 16 },
  summaryBox: { borderRadius: 10, padding: 10, marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  summaryLabel: { fontSize: 11 },
  summaryVal: { fontSize: 11, fontFamily: MONO },
  progressTrack: { height: 5, borderRadius: 999, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", borderRadius: 999 },
  manageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  manageItem: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 40 : 24 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetH2: { fontSize: 18, fontWeight: "700", marginBottom: 14, marginTop: 3 },
  fieldLabel: { fontSize: 11, fontFamily: MONO, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 },
  sheetInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, marginBottom: 10 },
  sheetSaveBtn: { borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 2 },
  sheetSaveBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});