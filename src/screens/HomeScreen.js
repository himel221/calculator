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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SCREEN_H = Dimensions.get("window").height;
const SAFE_TOP = Platform.OS === "android" ? 32 : 0;

// ─── Theme ───
const C = {
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
};

const MONO = Platform.select({ ios: "Menlo", android: "monospace" });

// ─── Storage Keys ───
const KEYS = {
  products: "@sp_products",
  units: "@sp_units",
  categories: "@sp_categories",
  history: "@sp_history",
  converters: "@sp_converters",
};

// ─── Default Data ───
const DEFAULT_PRODUCTS = [
  { id: "p1", name: "iPhone 15 Pro" },
  { id: "p2", name: "Samsung S24" },
];
const DEFAULT_UNITS = [
  { id: "u1", label: "US Dollar", symbol: "$", type: "currency" },
  { id: "u2", label: "Bangladeshi Taka", symbol: "৳", type: "currency" },
  { id: "u3", label: "Euro", symbol: "€", type: "currency" },
  { id: "u4", label: "Percentage", symbol: "%", type: "percentage" },
];
const DEFAULT_CATEGORIES = [
  { id: "c1", name: "Purchase Price" },
  { id: "c2", name: "Transport" },
  { id: "c3", name: "Tax / VAT" },
  { id: "c4", name: "Packaging" },
  { id: "c5", name: "Labour" },
];

// ─── Database Helper ───
async function dbSave(key, data) {
  try { await AsyncStorage.setItem(key, JSON.stringify(data)); }
  catch (e) { console.warn("DB Save Error:", key, e); }
}

async function dbLoad(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn("DB Load Error:", key, e);
    return fallback;
  }
}

function freshCostRow(cats) {
  return { id: Date.now().toString() + Math.random(), categoryId: cats[0]?.id ?? "", amount: "" };
}

// ─── Conversion Badge ───
function ConvBadge({ symbol, value, color }) {
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

// ─── Inline Dropdown ───
function InlineDropdown({ visible, onClose, options, onSelect, anchorLayout }) {
  if (!visible || !anchorLayout) return null;
  const maxH = 220;
  const listH = Math.min(options.length * 40, maxH);
  const spaceBelow = SCREEN_H - anchorLayout.py - anchorLayout.height - 8;
  const showAbove = spaceBelow < listH + 20;
  const top = showAbove ? anchorLayout.py - listH - 4 : anchorLayout.py + anchorLayout.height + 4;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <View style={{
            position: "absolute", top, left: anchorLayout.px, width: anchorLayout.width,
            maxHeight: maxH, backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1,
            borderColor: C.border, overflow: "hidden", elevation: 10,
            shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16,
          }}>
            <ScrollView nestedScrollEnabled bounces={false} keyboardShouldPersistTaps="handled">
              {options.map((item, idx) => (
                <TouchableOpacity key={item.value}
                  onPress={() => { onSelect(item.value); onClose(); }}
                  style={{ paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: C.border }}>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: "500" }} numberOfLines={1}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Dropdown Button ───
function DropdownButton({ label, value, options, onPress, onAdd }) {
  const selected = options.find((o) => o.value === value);
  return (
    <View style={s.card}>
      <View style={s.dropdownHeader}>
        <Text style={s.label}>{label}</Text>
        <TouchableOpacity onPress={onAdd} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 11, color: C.blue, fontWeight: "700", fontFamily: MONO }}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onPress} style={s.dropdownValue}>
        <Text style={{ color: C.text, fontWeight: "600", fontSize: 13, flex: 1 }} numberOfLines={1}>{selected?.label ?? "—"}</Text>
        <Text style={s.chevron}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Manage List ───
function ManageList({ title, items, onDelete, onAdd }) {
  return (
    <View>
      <View style={s.manageHeader}>
        <Text style={s.label}>{title} ({items.length})</Text>
        <TouchableOpacity onPress={onAdd}><Text style={{ fontSize: 12, color: C.blue, fontWeight: "600" }}>+ Add</Text></TouchableOpacity>
      </View>
      <View style={{ gap: 5 }}>
        {items.map((item) => (
          <View key={item.id} style={s.manageItem}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "500", color: C.text }}>{item.name}</Text>
              {item.sub !== "" && <Text style={{ fontSize: 9, fontFamily: MONO, color: C.muted, marginTop: 2 }}>{item.sub}</Text>}
            </View>
            <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: C.muted, fontSize: 11 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {items.length === 0 && <Text style={{ color: C.muted, fontSize: 12, paddingVertical: 4 }}>Nothing added yet.</Text>}
      </View>
    </View>
  );
}

// ═══════════════════════
// ─── Main App ──────────
// ═══════════════════════
export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [tab, setTab] = useState("calc");
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [history, setHistory] = useState([]);
  const [converterPairs, setConverterPairs] = useState([]);
  const [toast, setToast] = useState(null);

  const [title, setTitle] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(DEFAULT_PRODUCTS[0].id);
  const [selectedUnit, setSelectedUnit] = useState(DEFAULT_UNITS[0].id);
  const [sellingPrice, setSellingPrice] = useState("");
  const [costItems, setCostItems] = useState([freshCostRow(DEFAULT_CATEGORIES)]);
  const [profitView, setProfitView] = useState("both");
  const [resultUnitId, setResultUnitId] = useState(DEFAULT_UNITS[0].id);
  const [conversionRate, setConversionRate] = useState("1");
  const [result, setResult] = useState(null);

  // Target margin mode
  const [sellingMode, setSellingMode] = useState("price"); // "price" | "margin"
  const [targetMargin, setTargetMargin] = useState("");

  const [sheet, setSheet] = useState(null);
  const [newProductName, setNewProductName] = useState("");
  const [newUnitLabel, setNewUnitLabel] = useState("");
  const [newUnitSymbol, setNewUnitSymbol] = useState("");
  const [newUnitType, setNewUnitType] = useState("currency");
  const [newCatName, setNewCatName] = useState("");

  const [dropdown, setDropdown] = useState({ visible: false, type: null, id: null, anchor: null });
  const dropdownRefs = useRef({});

  // ═══════════════════════════════
  // ─── DATABASE: Load on startup ─
  // ═══════════════════════════════
  useEffect(() => {
    (async () => {
      const [p, u, c, h, cv] = await Promise.all([
        dbLoad(KEYS.products, DEFAULT_PRODUCTS),
        dbLoad(KEYS.units, DEFAULT_UNITS),
        dbLoad(KEYS.categories, DEFAULT_CATEGORIES),
        dbLoad(KEYS.history, []),
        dbLoad(KEYS.converters, []),
      ]);
      setProducts(p);
      setUnits(u);
      setCategories(c);
      setHistory(h);
      setConverterPairs(cv);
      setSelectedProduct(p[0]?.id ?? "");
      setSelectedUnit(u[0]?.id ?? "");
      setResultUnitId(u[0]?.id ?? "");
      setCostItems([freshCostRow(c)]);
      setDbReady(true);
    })();
  }, []);

  // ═══════════════════════════════════
  // ─── DATABASE: Auto-save on change ─
  // ═══════════════════════════════════
  useEffect(() => { if (dbReady) dbSave(KEYS.products, products); }, [products, dbReady]);
  useEffect(() => { if (dbReady) dbSave(KEYS.units, units); }, [units, dbReady]);
  useEffect(() => { if (dbReady) dbSave(KEYS.categories, categories); }, [categories, dbReady]);
  useEffect(() => { if (dbReady) dbSave(KEYS.history, history); }, [history, dbReady]);
  useEffect(() => { if (dbReady) dbSave(KEYS.converters, converterPairs); }, [converterPairs, dbReady]);

  const activeUnit = units.find((u) => u.id === selectedUnit) ?? units[0];
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
  function closeDropdown() { setDropdown({ visible: false, type: null, id: null, anchor: null }); }

  function handleDropdownSelect(value) {
    const { type, id } = dropdown;
    if (type === "product") { setSelectedProduct(value); setSellingPrice(""); setCostItems([freshCostRow(categories)]); setResult(null); setConversionRate("1"); }
    else if (type === "inputCurrency") { setSelectedUnit(value); if (isSameUnit) setResultUnitId(value); setResult(null); }
    else if (type === "resultCurrency") { setResultUnitId(value); if (value === selectedUnit) setConversionRate("1"); }
    else if (type === "costCategory") { updateCostRow(id, "categoryId", value); }
    else if (type === "converterFrom") { updateConverterPair(id, "fromUnitId", value); }
    else if (type === "converterTo") { updateConverterPair(id, "toUnitId", value); }
    closeDropdown();
  }

  function getDropdownOptions() {
    const { type } = dropdown;
    if (type === "product") return products.map((p) => ({ value: p.id, label: p.name }));
    if (type === "inputCurrency") return units.map((u) => ({ value: u.id, label: `${u.symbol} ${u.label}` }));
    if (type === "resultCurrency") return units.map((u) => ({ value: u.id, label: `${u.symbol} — ${u.label}` }));
    if (type === "costCategory") return categories.map((c) => ({ value: c.id, label: c.name }));
    if (type === "converterFrom" || type === "converterTo") return units.filter((u) => u.type === "currency").map((u) => ({ value: u.id, label: `${u.symbol} ${u.label}` }));
    return [];
  }

  function getConversions(amountStr) {
    const amt = parseFloat(amountStr);
    if (isNaN(amt) || amt === 0) return [];
    return converterPairs
      .filter((cp) => cp.fromUnitId === selectedUnit && parseFloat(cp.rate) > 0)
      .map((cp) => { const u = units.find((u) => u.id === cp.toUnitId); return { symbol: u?.symbol ?? "", value: amt * parseFloat(cp.rate) }; })
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

  function newCalculation() { setTitle(""); setSellingPrice(""); setCostItems([freshCostRow(categories)]); setResult(null); setConversionRate("1"); }
  function addCostRow() { setCostItems((p) => [...p, freshCostRow(categories)]); }
  function removeCostRow(id) { setCostItems((p) => p.filter((c) => c.id !== id)); }
  function updateCostRow(id, field, value) { setCostItems((p) => p.map((c) => (c.id === id ? { ...c, [field]: value } : c))); setResult(null); }

  function calculate() {
    const sp = parseFloat(sellingPrice);
    if (isNaN(sp)) return;
    const total = costItems.reduce((sum, ci) => sum + (parseFloat(ci.amount) || 0), 0);
    setResult({ profit: sp - total, percent: total > 0 ? ((sp - total) / total) * 100 : 0, totalCost: total });
  }

  function saveCalc() {
    if (!result) return;
    const product = products.find((p) => p.id === selectedProduct);
    setHistory((h) => [{
      id: Date.now().toString(), title: title.trim() || product?.name || "Untitled",
      productName: product?.name ?? "", productId: selectedProduct, unitId: selectedUnit, unitSymbol: activeUnit?.symbol ?? "$",
      sellingPrice: parseFloat(sellingPrice),
      costItems: costItems.filter((ci) => parseFloat(ci.amount) > 0).map((ci) => ({ categoryName: categories.find((c) => c.id === ci.categoryId)?.name ?? ci.categoryId, amount: parseFloat(ci.amount) })),
      totalCost: result.totalCost, profitAmount: result.profit, profitPercent: result.percent,
      resultUnitSymbol: resultUnit?.symbol ?? activeUnit?.symbol ?? "$", conversionRate: rate, convertedProfit: convertedProfit(result.profit),
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    }, ...h]);
    showToast("Saved to history", "green");
  }

  function loadFromHistory(h) {
    setTitle(h.title); setSelectedProduct(h.productId); setSelectedUnit(h.unitId); setResultUnitId(h.unitId);
    setConversionRate(h.conversionRate?.toString() ?? "1"); setSellingPrice(h.sellingPrice.toString());
    setCostItems(h.costItems.length > 0 ? h.costItems.map((ci, i) => ({ id: `l_${i}_${Date.now()}`, categoryId: categories.find((c) => c.name === ci.categoryName)?.id ?? categories[0]?.id ?? "", amount: ci.amount.toString() })) : [freshCostRow(categories)]);
    setResult({ profit: h.profitAmount, percent: h.profitPercent, totalCost: h.totalCost }); setTab("calc");
  }

  function addProduct() { if (!newProductName.trim()) return; const np = { id: Date.now().toString(), name: newProductName.trim() }; setProducts((p) => [...p, np]); setSelectedProduct(np.id); setNewProductName(""); setSheet(null); }
  function addUnit() { if (!newUnitLabel.trim() || !newUnitSymbol.trim()) return; const nu = { id: Date.now().toString(), label: newUnitLabel.trim(), symbol: newUnitSymbol.trim(), type: newUnitType }; setUnits((u) => [...u, nu]); setSelectedUnit(nu.id); setNewUnitLabel(""); setNewUnitSymbol(""); setSheet(null); }
  function addCategory() { if (!newCatName.trim()) return; setCategories((c) => [...c, { id: Date.now().toString(), name: newCatName.trim() }]); setNewCatName(""); setSheet(null); }

  function addConverterPair() { setConverterPairs((p) => [...p, { id: Date.now().toString(), fromUnitId: units[0]?.id ?? "", toUnitId: units[1]?.id ?? units[0]?.id ?? "", rate: "" }]); }
  function removeConverterPair(id) { setConverterPairs((p) => p.filter((x) => x.id !== id)); }
  function updateConverterPair(id, field, value) { setConverterPairs((p) => p.map((x) => (x.id === id ? { ...x, [field]: value } : x))); }
  function deleteHistory(id) { setHistory((h) => h.filter((x) => x.id !== id)); showToast("Deleted from history", "red"); }

  const isLoss = result !== null && result.profit < 0;
  const accentColor = isLoss ? C.red : C.green;
  const totalCostLive = costItems.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  // Target margin calculation
  const suggestedPrice =
    sellingMode === "margin" && targetMargin !== "" && totalCostLive > 0
      ? totalCostLive * (1 + parseFloat(targetMargin) / 100)
      : null;

  function applyTargetMargin() {
    if (suggestedPrice === null) return;
    setSellingPrice(suggestedPrice.toFixed(2));
    setSellingMode("price");
    setTargetMargin("");
    const sp = suggestedPrice;
    const total = totalCostLive;
    const profit = sp - total;
    const percent = total > 0 ? (profit / total) * 100 : 0;
    setResult({ profit, percent, totalCost: total });
  }

  const toastTimer = useRef(null);
  function showToast(message, type) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }

  const setRef = useCallback((key) => (el) => { if (el) dropdownRefs.current[key] = el; }, []);

  function renderConvBadges(amountStr, color) {
    const convs = getConversions(amountStr);
    if (convs.length === 0) return null;
    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "50%", gap: 2 }}>
        {convs.map((cv, i) => <ConvBadge key={i} symbol={cv.symbol} value={cv.value} color={color} />)}
      </View>
    );
  }

  // ═══════════════════════════
  // ─── Loading Screen ────────
  // ═══════════════════════════
  if (!dbReady) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={C.blue} />
        <Text style={{ color: C.muted, fontSize: 12, fontFamily: MONO, marginTop: 12 }}>Loading data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: SAFE_TOP + 8 }]}>
        <View>
          <Text style={s.headerSub}>SmartProfit</Text>
          <Text style={s.headerTitle}>Calculator</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {tab === "calc" && (
            <TouchableOpacity onPress={newCalculation} style={s.plusBtn}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginTop: -1 }}>+</Text>
            </TouchableOpacity>
          )}
          <View style={s.iconBtn}><Text style={{ fontSize: 14 }}>📊</Text></View>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {["calc", "history", "manage"].map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tabBtn, tab === t && s.tabActive]}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === "calc" ? "Calculator" : t === "history" ? "History" : "Manage"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ═══════ CALCULATOR ═══════ */}
      {tab === "calc" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            <View style={s.cardInner}>
              <Text style={s.label}>Title (optional)</Text>
              <TextInput placeholder="e.g. June Batch — iPhone 15" placeholderTextColor={C.border}
                value={title} onChangeText={setTitle} style={s.titleInput} />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }} ref={setRef("product")} collapsable={false}>
              <DropdownButton label="Product" value={selectedProduct}
                options={products.map((p) => ({ value: p.id, label: p.name }))}
                onPress={() => openDropdown("product", "product")} onAdd={() => setSheet("product")} />
            </View>
            <View style={{ flex: 1 }} ref={setRef("inputCurrency")} collapsable={false}>
              <DropdownButton label="Input Currency" value={selectedUnit}
                options={units.map((u) => ({ value: u.id, label: `${u.symbol} ${u.label}` }))}
                onPress={() => openDropdown("inputCurrency", "inputCurrency")} onAdd={() => setSheet("unit")} />
            </View>
          </View>

          {/* Currency Converter */}
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Currency Converter</Text>
                <Text style={s.hint}>Auto-converts cost rows to target currencies</Text>
              </View>
              <TouchableOpacity onPress={addConverterPair} style={s.addPill}>
                <Text style={s.addPillText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {converterPairs.length === 0 ? (
              <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
                <Text style={{ fontSize: 9, color: C.border, fontFamily: MONO, fontStyle: "italic" }}>No converters yet. Tap + Add to set rates.</Text>
              </View>
            ) : converterPairs.map((cp, idx) => {
              const fromU = units.find((u) => u.id === cp.fromUnitId);
              const toU = units.find((u) => u.id === cp.toUnitId);
              return (
                <View key={cp.id} style={[s.converterRow, idx > 0 && s.borderTop]}>
                  <Text style={s.converterOne}>1</Text>
                  <TouchableOpacity ref={setRef(`cf_${cp.id}`)} collapsable={false}
                    onPress={() => openDropdown("converterFrom", `cf_${cp.id}`, cp.id)} style={s.miniSelect}>
                    <Text style={s.miniSelectText} numberOfLines={1}>{fromU?.symbol} {fromU?.label}</Text>
                    <Text style={s.chevron}>▼</Text>
                  </TouchableOpacity>
                  <Text style={s.converterEq}>=</Text>
                  <TextInput keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={C.border}
                    value={cp.rate} onChangeText={(v) => updateConverterPair(cp.id, "rate", v)} style={s.converterInput} />
                  <TouchableOpacity ref={setRef(`ct_${cp.id}`)} collapsable={false}
                    onPress={() => openDropdown("converterTo", `ct_${cp.id}`, cp.id)} style={[s.miniSelect, { flex: 1 }]}>
                    <Text style={s.miniSelectText} numberOfLines={1}>{toU?.symbol} {toU?.label}</Text>
                    <Text style={s.chevron}>▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeConverterPair(cp.id)} style={s.removeBtn}>
                    <Text style={{ color: C.muted, fontSize: 11 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Cost Breakdown */}
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <Text style={s.label}>Cost Breakdown</Text>
              <TouchableOpacity onPress={() => setSheet("category")}>
                <Text style={{ fontSize: 10, color: C.blue, fontWeight: "600", fontFamily: MONO }}>+ Category</Text>
              </TouchableOpacity>
            </View>
            {costItems.map((ci, idx) => {
              const catName = categories.find((c) => c.id === ci.categoryId)?.name ?? "Select";
              const convBadges = renderConvBadges(ci.amount, C.blue);
              return (
                <View key={ci.id} style={[s.costRow, idx > 0 && s.borderTop]}>
                  <View style={s.costCatRow}>
                    <TouchableOpacity ref={setRef(`cc_${ci.id}`)} collapsable={false}
                      onPress={() => openDropdown("costCategory", `cc_${ci.id}`, ci.id)}
                      style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                      <Text style={{ color: C.text, fontSize: 13, fontWeight: "600", flex: 1 }}>{catName}</Text>
                      <Text style={[s.chevron, { marginRight: 6 }]}>▼</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeCostRow(ci.id)} style={s.removeBtn}>
                      <Text style={{ color: C.muted, fontSize: 11 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.inputRow}>
                    <Text style={s.currencySymbol}>{activeUnit?.symbol}</Text>
                    <TextInput keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={C.border}
                      value={ci.amount} onChangeText={(v) => updateCostRow(ci.id, "amount", v)} style={s.amountInput} />
                    {convBadges ? convBadges : (
                      <Text style={{ fontSize: 9, color: C.muted, fontFamily: MONO }}>{activeUnit?.label}</Text>
                    )}
                  </View>
                </View>
              );
            })}
            <View style={s.costFooter}>
              <TouchableOpacity onPress={addCostRow} style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: C.blue, fontSize: 14, marginRight: 3 }}>+</Text>
                <Text style={{ color: C.blue, fontSize: 11, fontWeight: "600" }}>Add Cost Row</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Text style={{ fontSize: 11, fontFamily: MONO, color: C.textSub }}>Total: </Text>
                <Text style={{ fontSize: 11, fontFamily: MONO, color: C.red, fontWeight: "700" }}>
                  {activeUnit?.symbol}{totalCostLive.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                {renderConvBadges(totalCostLive.toString(), C.blue)}
              </View>
            </View>
          </View>

          {/* Selling Price */}
          <View style={s.card}>
            {/* Mode toggle header */}
            <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={s.label}>Selling Price</Text>
              <View style={{ flexDirection: "row", borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: C.border }}>
                <TouchableOpacity
                  onPress={() => { setSellingMode("price"); setTargetMargin(""); }}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: sellingMode === "price" ? C.blue : "transparent" }}>
                  <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: "600", letterSpacing: 0.5, color: sellingMode === "price" ? "#fff" : C.muted }}>Enter Price</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setSellingMode("margin"); setResult(null); }}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: sellingMode === "margin" ? C.green : "transparent" }}>
                  <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: "600", letterSpacing: 0.5, color: sellingMode === "margin" ? "#fff" : C.muted }}>Set Target %</Text>
                </TouchableOpacity>
              </View>
            </View>

            {sellingMode === "price" ? (
              <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: C.green, fontFamily: MONO, fontWeight: "700", fontSize: 16 }}>{activeUnit?.symbol}</Text>
                  <TextInput keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={C.border}
                    value={sellingPrice} onChangeText={(v) => { setSellingPrice(v); setResult(null); }}
                    style={{ flex: 1, color: C.text, fontFamily: MONO, fontWeight: "600", fontSize: 20, padding: 0, marginLeft: 6 }} />
                  {renderConvBadges(sellingPrice, C.green)}
                </View>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                {/* Target margin input */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.surface2, borderRadius: 10, borderWidth: 1, borderColor: "rgba(45,212,160,0.35)", paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 }}>
                  <Text style={{ color: C.muted, fontSize: 11, fontFamily: MONO }}>Desired Profit</Text>
                  <TextInput keyboardType="decimal-pad" placeholder="e.g. 25" placeholderTextColor={C.border}
                    value={targetMargin} onChangeText={(v) => { setTargetMargin(v); setResult(null); }}
                    style={{ flex: 1, color: C.text, fontFamily: MONO, fontWeight: "700", fontSize: 18, padding: 0, textAlign: "right" }} />
                  <Text style={{ color: C.green, fontFamily: MONO, fontWeight: "700", fontSize: 16 }}>%</Text>
                </View>

                {/* Suggested price preview */}
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
                    {renderConvBadges(suggestedPrice.toFixed(2), C.green) && (
                      <View style={{ marginBottom: 10 }}>
                        {renderConvBadges(suggestedPrice.toFixed(2), C.green)}
                      </View>
                    )}
                    <TouchableOpacity onPress={applyTargetMargin} activeOpacity={0.85}
                      style={{ backgroundColor: C.green, borderRadius: 8, paddingVertical: 10, alignItems: "center" }}>
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

          {/* Calculate button — only in price mode */}
          {sellingMode === "price" && (
            <TouchableOpacity onPress={calculate} activeOpacity={0.85} style={s.calcBtn}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.5 }}>Calculate Profit</Text>
            </TouchableOpacity>
          )}

          {/* Result */}
          {result !== null && (
            <View style={[s.card, { borderColor: isLoss ? "rgba(240,96,96,0.25)" : "rgba(45,212,160,0.25)", backgroundColor: isLoss ? "rgba(240,96,96,0.024)" : "rgba(45,212,160,0.024)" }]}>
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <Text style={s.label}>Result</Text>
                  <View style={{ backgroundColor: isLoss ? "rgba(240,96,96,0.1)" : "rgba(45,212,160,0.1)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: "700", color: accentColor }}>{isLoss ? "LOSS" : "PROFIT"}</Text>
                  </View>
                </View>
                <Text style={[s.label, { marginBottom: 6 }]}>Show Profit As</Text>
                <View style={{ flexDirection: "row", gap: 6, marginBottom: 14 }}>
                  {["amount", "percent", "both"].map((v) => (
                    <TouchableOpacity key={v} onPress={() => setProfitView(v)} style={[s.toggleBtn, profitView === v && s.toggleActive]}>
                      <Text style={[s.toggleText, profitView === v && s.toggleTextActive]}>
                        {v === "amount" ? "Amount" : v === "percent" ? "%" : "Both"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[s.label, { marginBottom: 6 }]}>Result Currency</Text>
                <TouchableOpacity ref={setRef("resultCurrency")} collapsable={false}
                  onPress={() => openDropdown("resultCurrency", "resultCurrency")}
                  style={[s.inputRow, { marginBottom: 14 }]}>
                  <Text style={{ color: C.text, fontSize: 13, fontWeight: "600", flex: 1 }}>{resultUnit?.symbol} — {resultUnit?.label}</Text>
                  <Text style={s.chevron}>▼</Text>
                </TouchableOpacity>
                {!isSameUnit && resultUnit?.type !== "percentage" && activeUnit?.type !== "percentage" && (
                  <>
                    <Text style={[s.label, { marginBottom: 6 }]}>Exchange Rate</Text>
                    <View style={[s.inputRow, { borderColor: "rgba(74,124,255,0.4)", marginBottom: 14 }]}>
                      <Text style={{ color: C.muted, fontSize: 11, fontFamily: MONO }}>1 {activeUnit?.symbol} =</Text>
                      <TextInput keyboardType="decimal-pad" placeholder="1.00" placeholderTextColor={C.border}
                        value={conversionRate} onChangeText={setConversionRate}
                        style={{ flex: 1, color: C.text, fontFamily: MONO, fontWeight: "600", fontSize: 14, padding: 0, marginLeft: 6 }} />
                      <Text style={{ color: C.blue, fontFamily: MONO, fontWeight: "700", fontSize: 12 }}>{resultUnit?.symbol}</Text>
                    </View>
                  </>
                )}
                <View style={s.divider} />
                <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 16 }}>
                  {(profitView === "amount" || profitView === "both") && (
                    <View>
                      <Text style={s.resultSubLabel}>{!isSameUnit ? `Amount (${resultUnit?.symbol})` : "Amount"}</Text>
                      <Text style={{ fontSize: 28, fontWeight: "700", color: accentColor }}>{fmt(result.profit)}</Text>
                    </View>
                  )}
                  {(profitView === "percent" || profitView === "both") && (
                    <View style={profitView === "both" ? { marginLeft: "auto", alignItems: "flex-end" } : {}}>
                      <Text style={s.resultSubLabel}>Margin</Text>
                      <Text style={{ fontSize: 20, fontFamily: MONO, fontWeight: "700", color: accentColor }}>
                        {result.percent >= 0 ? "+" : ""}{result.percent.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
                <View style={s.summaryBox}>
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Selling Price</Text>
                    <Text style={s.summaryVal}>{activeUnit?.symbol}{parseFloat(sellingPrice).toFixed(2)}</Text>
                  </View>
                  {costItems.filter((ci) => parseFloat(ci.amount) > 0).map((ci) => (
                    <View key={ci.id} style={s.summaryRow}>
                      <Text style={[s.summaryLabel, { color: C.muted }]}>{categories.find((c) => c.id === ci.categoryId)?.name}</Text>
                      <Text style={s.summaryVal}>−{activeUnit?.symbol}{parseFloat(ci.amount).toFixed(2)}</Text>
                    </View>
                  ))}
                  <View style={[s.summaryRow, s.borderTop, { paddingTop: 6 }]}>
                    <Text style={s.summaryLabel}>Total Cost</Text>
                    <Text style={[s.summaryVal, { color: C.red }]}>−{activeUnit?.symbol}{result.totalCost.toFixed(2)}</Text>
                  </View>
                  <View style={[s.summaryRow, s.borderTop, { paddingTop: 6 }]}>
                    <Text style={[s.summaryLabel, { fontWeight: "700", color: accentColor }]}>{isLoss ? "Net Loss" : "Net Profit"}{!isSameUnit ? ` (${resultUnit?.symbol})` : ""}</Text>
                    <Text style={[s.summaryVal, { fontWeight: "700", color: accentColor }]}>{fmt(result.profit)}</Text>
                  </View>
                  {!isSameUnit && resultUnit?.type !== "percentage" && (
                    <Text style={{ fontSize: 8, fontFamily: MONO, color: C.muted, textAlign: "right", marginTop: 4 }}>Rate: 1{activeUnit?.symbol} = {rate}{resultUnit?.symbol}</Text>
                  )}
                </View>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${Math.min(Math.abs(result.percent), 100)}%`, backgroundColor: accentColor }]} />
                </View>
                <TouchableOpacity onPress={saveCalc} style={s.saveBtn}>
                  <Text style={{ color: C.textSub, fontSize: 13, fontWeight: "500" }}>Save to History</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ═══════ HISTORY ═══════ */}
      {tab === "history" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text style={{ color: C.muted, fontSize: 11, fontFamily: MONO }}>{history.length} saved</Text>
            {history.length > 0 && <TouchableOpacity onPress={() => { setHistory([]); showToast("All history cleared", "red"); }}><Text style={{ fontSize: 11, color: C.red, fontWeight: "500" }}>Clear All</Text></TouchableOpacity>}
          </View>
          {history.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 80 }}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📜</Text>
              <Text style={{ color: C.muted, fontSize: 13 }}>No saved calculations yet</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {history.map((h) => {
                const loss = h.profitAmount < 0; const ac = loss ? C.red : C.green;
                const dp = h.resultUnitSymbol !== h.unitSymbol ? `${h.resultUnitSymbol}${Math.abs(h.convertedProfit).toFixed(2)}` : `${h.unitSymbol}${Math.abs(h.profitAmount).toFixed(2)}`;
                return (
                  <View key={h.id} style={s.card}>
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
                    {h.costItems.length > 0 && (
                      <View style={{ paddingHorizontal: 12, paddingBottom: 8, flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                        {h.costItems.map((ci, i) => (
                          <View key={i} style={{ backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text style={{ fontSize: 8, fontFamily: MONO, color: C.muted }}>{ci.categoryName}: {h.unitSymbol}{ci.amount.toFixed(2)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <TouchableOpacity onPress={() => loadFromHistory(h)} style={s.loadBtn}>
                      <Text style={{ fontSize: 9, fontFamily: MONO, fontWeight: "600", color: C.blue, letterSpacing: 1.5, textTransform: "uppercase" }}>Load & Edit →</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* ═══════ MANAGE ═══════ */}
      {tab === "manage" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.scrollContent, { gap: 20 }]}>
          <ManageList title="Products" items={products.map((p) => ({ id: p.id, name: p.name, sub: "" }))} onDelete={(id) => setProducts((p) => p.filter((x) => x.id !== id))} onAdd={() => setSheet("product")} />
          <ManageList title="Currencies & Units" items={units.map((u) => ({ id: u.id, name: u.label, sub: `${u.symbol} · ${u.type}` }))} onDelete={(id) => setUnits((u) => u.filter((x) => x.id !== id))} onAdd={() => setSheet("unit")} />
          <ManageList title="Cost Categories" items={categories.map((c) => ({ id: c.id, name: c.name, sub: "" }))} onDelete={(id) => setCategories((c) => c.filter((x) => x.id !== id))} onAdd={() => setSheet("category")} />
        </ScrollView>
      )}

      {/* Inline Dropdown */}
      <InlineDropdown visible={dropdown.visible} onClose={closeDropdown} options={getDropdownOptions()} onSelect={handleDropdownSelect} anchorLayout={dropdown.anchor} />

      {/* Add Sheets */}
      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setSheet(null)}>
          <View style={s.sheetContainer} onStartShouldSetResponder={() => true}>
            <View style={s.sheetHandle} />
            {sheet === "product" && (<>
              <Text style={s.label}>New Product</Text>
              <Text style={s.sheetH2}>Add Product</Text>
              <Text style={s.fieldLabel}>Product Name</Text>
              <TextInput autoFocus placeholder="e.g. iPhone 15 Pro Max" placeholderTextColor={C.muted} value={newProductName} onChangeText={setNewProductName} onSubmitEditing={addProduct} style={s.sheetInput} />
              <TouchableOpacity onPress={addProduct} disabled={!newProductName.trim()} style={[s.sheetSaveBtn, !newProductName.trim() && { opacity: 0.4 }]}><Text style={s.sheetSaveBtnText}>Save</Text></TouchableOpacity>
            </>)}
            {sheet === "unit" && (<>
              <Text style={s.label}>New Unit</Text>
              <Text style={s.sheetH2}>Add Currency / Unit</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Label</Text>
                  <TextInput autoFocus placeholder="US Dollar" placeholderTextColor={C.muted} value={newUnitLabel} onChangeText={setNewUnitLabel} style={s.sheetInput} />
                </View>
                <View style={{ width: 72 }}>
                  <Text style={s.fieldLabel}>Symbol</Text>
                  <TextInput placeholder="$" placeholderTextColor={C.muted} value={newUnitSymbol} onChangeText={setNewUnitSymbol} style={[s.sheetInput, { textAlign: "center", fontFamily: MONO }]} />
                </View>
              </View>
              <Text style={s.fieldLabel}>Type</Text>
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 14 }}>
                {["currency", "percentage"].map((t) => (
                  <TouchableOpacity key={t} onPress={() => setNewUnitType(t)} style={[s.toggleBtn, { paddingVertical: 8 }, newUnitType === t && s.toggleActive]}>
                    <Text style={[s.toggleText, { fontSize: 13 }, newUnitType === t && s.toggleTextActive]}>{t === "currency" ? "💱 Currency" : "% Percentage"}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={addUnit} disabled={!newUnitLabel.trim() || !newUnitSymbol.trim()} style={[s.sheetSaveBtn, (!newUnitLabel.trim() || !newUnitSymbol.trim()) && { opacity: 0.4 }]}><Text style={s.sheetSaveBtnText}>Save</Text></TouchableOpacity>
            </>)}
            {sheet === "category" && (<>
              <Text style={s.label}>New Category</Text>
              <Text style={s.sheetH2}>Add Cost Category</Text>
              <Text style={s.fieldLabel}>Category Name</Text>
              <TextInput autoFocus placeholder="e.g. Customs Duty" placeholderTextColor={C.muted} value={newCatName} onChangeText={setNewCatName} onSubmitEditing={addCategory} style={s.sheetInput} />
              <TouchableOpacity onPress={addCategory} disabled={!newCatName.trim()} style={[s.sheetSaveBtn, !newCatName.trim() && { opacity: 0.4 }]}><Text style={s.sheetSaveBtnText}>Save</Text></TouchableOpacity>
            </>)}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Toast */}
      {toast && (
        <View style={{
          position: "absolute", bottom: 40, left: 20, right: 20,
          backgroundColor: toast.type === "green" ? C.green : C.red,
          borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16,
          flexDirection: "row", alignItems: "center", gap: 8,
          elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3, shadowRadius: 8,
        }}>
          <Text style={{ fontSize: 16 }}>{toast.type === "green" ? "✓" : "🗑"}</Text>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 }}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerSub: { fontSize: 9, fontFamily: MONO, color: C.muted, letterSpacing: 2, textTransform: "uppercase" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: C.text, marginTop: 1 },
  tabs: { flexDirection: "row", paddingHorizontal: 16, gap: 4, marginBottom: 10 },
  tabBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center", backgroundColor: C.surface },
  tabActive: { backgroundColor: C.blue },
  tabText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3, color: C.muted },
  tabTextActive: { color: "#fff" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 36, gap: 8 },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  cardInner: { paddingHorizontal: 12, paddingVertical: 10 },
  label: { fontSize: 9, fontFamily: MONO, letterSpacing: 1.2, color: C.muted, textTransform: "uppercase" },
  hint: { fontSize: 8, color: C.muted, fontFamily: MONO, marginTop: 1 },
  dropdownHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingTop: 8 },
  dropdownValue: { paddingHorizontal: 10, paddingBottom: 8, paddingTop: 3, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chevron: { color: C.muted, fontSize: 8 },
  sectionHeader: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  borderTop: { borderTopWidth: 1, borderTopColor: C.border },
  plusBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.blue, alignItems: "center", justifyContent: "center", elevation: 4, shadowColor: C.blue, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface2, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border },
  addPill: { backgroundColor: "rgba(74,124,255,0.1)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  addPillText: { fontSize: 9, color: C.blue, fontWeight: "700", fontFamily: MONO },
  removeBtn: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  calcBtn: { backgroundColor: C.blue, borderRadius: 14, paddingVertical: 14, alignItems: "center", elevation: 4, shadowColor: C.blue, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8 },
  saveBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  loadBtn: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border, alignItems: "center" },
  toggleBtn: { flex: 1, paddingVertical: 5, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2 },
  toggleActive: { backgroundColor: C.blue, borderColor: C.blue },
  toggleText: { fontSize: 11, fontWeight: "600", color: C.textSub },
  toggleTextActive: { color: "#fff" },
  titleInput: { color: C.text, fontWeight: "600", fontSize: 13, padding: 0, marginTop: 3 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.surface2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: C.border },
  currencySymbol: { color: C.red, fontFamily: MONO, fontWeight: "700", fontSize: 13 },
  amountInput: { flex: 1, color: C.text, fontFamily: MONO, fontWeight: "600", fontSize: 14, padding: 0, marginLeft: 6 },
  converterRow: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 5 },
  converterOne: { fontSize: 9, fontFamily: MONO, color: C.muted },
  converterEq: { fontSize: 9, color: C.muted, fontFamily: MONO },
  converterInput: { width: 56, backgroundColor: C.surface2, borderWidth: 1, borderColor: "rgba(74,124,255,0.3)", borderRadius: 6, color: C.text, fontFamily: MONO, fontWeight: "700", fontSize: 11, paddingHorizontal: 4, paddingVertical: 5, textAlign: "center" },
  miniSelect: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 2, width: 72 },
  miniSelectText: { color: C.text, fontSize: 10, fontFamily: MONO, fontWeight: "700", flex: 1 },
  costRow: { paddingHorizontal: 12, paddingVertical: 8 },
  costCatRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  costFooter: { paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultSubLabel: { color: C.textSub, fontSize: 9, marginBottom: 3 },
  divider: { borderTopWidth: 1, borderTopColor: C.border, marginBottom: 16 },
  summaryBox: { backgroundColor: C.surface2, borderRadius: 10, padding: 10, marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  summaryLabel: { fontSize: 11, color: C.textSub },
  summaryVal: { fontSize: 11, fontFamily: MONO, color: C.textSub },
  progressTrack: { height: 5, borderRadius: 999, backgroundColor: C.surface2, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", borderRadius: 999 },
  manageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  manageItem: { backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheetContainer: { backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderTopColor: C.border, padding: 20 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 16 },
  sheetH2: { fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 14, marginTop: 3 },
  fieldLabel: { fontSize: 11, color: C.muted, fontFamily: MONO, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 },
  sheetInput: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: C.text, fontSize: 13, marginBottom: 10 },
  sheetSaveBtn: { backgroundColor: C.blue, borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 2 },
  sheetSaveBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});