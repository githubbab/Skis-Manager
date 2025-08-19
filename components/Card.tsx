import Row from "@/components/Row";
import { ThemeContext } from "@/context/ThemeContext";
import { ReactNode, useContext } from "react";

export default function Card({borderColor, isFlex, children}: { borderColor?: string; isFlex?: number; children: ReactNode }) {
  const { colorsTheme } = useContext(ThemeContext);

  return (
    <Row style={
      {
        borderRadius: 10,
        paddingVertical: 1,
        marginTop: 2,
        paddingHorizontal: 7,
        borderWidth: 1,
        borderColor: borderColor || colorsTheme.border,
        flex: isFlex,
      }
    }>
      {children}
    </Row>
  )
}

