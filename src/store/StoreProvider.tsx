"use client"
import { Provider } from "react-redux"
import { store } from "."
import { FC, PropsWithChildren } from "react"

const StoreProvider: FC<PropsWithChildren> = ({ children }) => <Provider store={store}>{children}</Provider>;

export default StoreProvider;