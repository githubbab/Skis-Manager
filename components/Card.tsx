import Row from "@/components/Row";
import { ThemeContext } from "@/context/ThemeContext";
import { ReactNode, useContext } from "react";

type CardProps = {
  borderColor?: string;
  flex?: number;
  children: ReactNode;
}

export default function Card({ borderColor, flex, children }: CardProps) {
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
        flex: flex,
      }
    }>
      {children}
    </Row>
  )
}

