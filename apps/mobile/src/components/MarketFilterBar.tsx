import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Market } from "@/api/types";
import { ALL_MARKETS, type MarketFilter, REGIONS, marketsInRegion, regionLabel } from "@/content/marketFilter";
import { colors, fonts, spacing } from "@/theme";

type Props = {
  markets: Market[];
  value: MarketFilter;
  onChange: (filter: MarketFilter) => void;
};

// Two rows of options: regions, then (when a region is picked) its markets.
// "Controlled" component: the screen owns the selected value and passes it in.
export function MarketFilterBar({ markets, value, onChange }: Props) {
  const selectedRegion = value.kind === "all" ? null : value.region;

  return (
    <View style={styles.container}>
      <OptionRow>
        <Option label="All" selected={value.kind === "all"} onPress={() => onChange(ALL_MARKETS)} />
        {REGIONS.map(({ region, label }) => (
          <Option
            key={region}
            label={label}
            selected={selectedRegion === region}
            onPress={() => onChange({ kind: "region", region })}
          />
        ))}
      </OptionRow>

      {selectedRegion && (
        <OptionRow>
          <Option
            label={`All ${regionLabel(selectedRegion)}`}
            selected={value.kind === "region"}
            onPress={() => onChange({ kind: "region", region: selectedRegion })}
            small
          />
          {marketsInRegion(markets, selectedRegion).map((market) => (
            <Option
              key={market.code}
              label={market.name}
              selected={value.kind === "market" && value.marketCode === market.code}
              onPress={() => onChange({ kind: "market", region: selectedRegion, marketCode: market.code })}
              small
            />
          ))}
        </OptionRow>
      )}
    </View>
  );
}

// Scrolls sideways if the options don't fit on a narrow phone.
function OptionRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {children}
    </ScrollView>
  );
}

type OptionProps = { label: string; selected: boolean; onPress: () => void; small?: boolean };

function Option({ label, selected, onPress, small = false }: OptionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }} // screen readers announce "selected"
      style={[styles.option, small && styles.optionSmall, selected && styles.optionSelected]}
    >
      <Text style={[styles.optionText, small && styles.optionTextSmall, selected && styles.optionTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  row: {
    gap: spacing.sm,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionSmall: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.plum, // BRANDING.md: Plum for primary/selected
    borderColor: colors.plum,
  },
  optionText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.plum,
  },
  optionTextSmall: {
    fontSize: 13,
  },
  optionTextSelected: {
    color: colors.cream,
  },
});
