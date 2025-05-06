"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check, ChevronDown, ChevronRight, Save, Code, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import type { JSX } from "react/jsx-runtime"

interface XmlViewerProps {
  xml: string
  onSave?: (updatedXml: string) => void
  readOnly?: boolean
}

interface XmlNode {
  type: "element" | "text"
  name?: string
  attributes?: Record<string, string>
  children?: XmlNode[]
  text?: string
  collapsed?: boolean
  depth: number
}

export function XmlViewer({ xml: initialXml, onSave, readOnly = false }: XmlViewerProps) {
  const [parsedXml, setParsedXml] = useState<XmlNode | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("view")
  const [editedXml, setEditedXml] = useState(initialXml)
  const [validationError, setValidationError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setEditedXml(initialXml)
    parseXml(initialXml)
  }, [initialXml])

  const parseXml = (xmlContent: string) => {
    try {
      if (!xmlContent.trim()) {
        setParsedXml(null)
        setError("No XML content to display")
        return
      }

      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml")

      // Check for parsing errors
      const parseError = xmlDoc.querySelector("parsererror")
      if (parseError) {
        setError("Invalid XML format")
        setParsedXml(null)
        return
      }

      const parseNode = (node: Node, depth = 0): XmlNode => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim() || ""
          if (!text) return { type: "text", text: "", depth }
          return { type: "text", text, depth }
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element
          const attributes: Record<string, string> = {}

          Array.from(element.attributes).forEach((attr) => {
            attributes[attr.name] = attr.value
          })

          const children = Array.from(node.childNodes)
            .map((child) => parseNode(child, depth + 1))
            .filter((child) => child.type !== "text" || child.text?.trim())

          return {
            type: "element",
            name: element.tagName,
            attributes: Object.keys(attributes).length ? attributes : undefined,
            children: children.length ? children : undefined,
            collapsed: depth > 2, // Collapse deeper nodes by default
            depth,
          }
        }

        return { type: "text", text: "", depth }
      }

      setParsedXml(parseNode(xmlDoc.documentElement))
      setError(null)
    } catch (err) {
      console.error("Error parsing XML:", err)
      setError("Failed to parse XML")
      setParsedXml(null)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeTab === "edit" ? editedXml : initialXml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleCollapse = (node: XmlNode) => {
    if (node.type !== "element" || !node.children?.length) return

    node.collapsed = !node.collapsed
    setParsedXml({ ...parsedXml! })
  }

  const handleSave = () => {
    try {
      // Validate XML before saving
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(editedXml, "text/xml")

      // Check for parsing errors
      const parseError = xmlDoc.querySelector("parsererror")
      if (parseError) {
        setValidationError("Invalid XML format. Please fix the errors before saving.")
        toast({
          title: "Validation Error",
          description: "The XML contains syntax errors. Please fix them before saving.",
          variant: "destructive",
        })
        return
      }

      setValidationError(null)

      // Update the parsed view
      parseXml(editedXml)

      // Call the onSave callback if provided
      if (onSave) {
        onSave(editedXml)
        toast({
          title: "XML Saved",
          description: "Your changes have been saved successfully.",
        })
      }

      // Switch to view tab
      setActiveTab("view")
    } catch (err) {
      console.error("Error saving XML:", err)
      setValidationError("Failed to validate XML. Please check for syntax errors.")
      toast({
        title: "Error",
        description: "Failed to save XML. Please check for syntax errors.",
        variant: "destructive",
      })
    }
  }

  const formatXml = () => {
    try {
      // Parse and format the XML
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(editedXml, "text/xml")

      // Check for parsing errors
      const parseError = xmlDoc.querySelector("parsererror")
      if (parseError) {
        setValidationError("Cannot format invalid XML. Please fix the errors first.")
        toast({
          title: "Validation Error",
          description: "Cannot format invalid XML. Please fix the errors first.",
          variant: "destructive",
        })
        return
      }

      // Format the XML with proper indentation
      const serializer = new XMLSerializer()
      let formattedXml = serializer.serializeToString(xmlDoc)

      // Use a more sophisticated formatting approach
      formattedXml = formatXmlString(formattedXml)

      setEditedXml(formattedXml)
      setValidationError(null)

      toast({
        title: "XML Formatted",
        description: "The XML has been formatted successfully.",
      })
    } catch (err) {
      console.error("Error formatting XML:", err)
      setValidationError("Failed to format XML. Please check for syntax errors.")
      toast({
        title: "Error",
        description: "Failed to format XML. Please check for syntax errors.",
        variant: "destructive",
      })
    }
  }

  // Helper function to format XML with proper indentation
  const formatXmlString = (xml: string): string => {
    let formatted = ""
    let indent = ""
    const tab = "  " // 2 spaces for indentation

    xml.split(/>\s*</).forEach((node) => {
      if (node.match(/^\/\w/)) {
        // If this is a closing tag, decrease indentation
        indent = indent.substring(tab.length)
      }

      formatted += indent + "<" + node + ">\n"

      if (node.match(/^<?\w[^>]*[^/]$/) && !node.startsWith("?")) {
        // If this is an opening tag (not self-closing), increase indentation
        indent += tab
      }
    })

    // Remove the first < and the last >
    return formatted.substring(1, formatted.length - 2)
  }

  const validateXml = () => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(editedXml, "text/xml")

      // Check for parsing errors
      const parseError = xmlDoc.querySelector("parsererror")
      if (parseError) {
        setValidationError("The XML contains syntax errors. Please fix them before saving.")
        toast({
          title: "Validation Error",
          description: "The XML contains syntax errors.",
          variant: "destructive",
        })
        return false
      }

      setValidationError(null)
      toast({
        title: "XML Valid",
        description: "The XML is valid.",
      })
      return true
    } catch (err) {
      console.error("Error validating XML:", err)
      setValidationError("Failed to validate XML. Please check for syntax errors.")
      toast({
        title: "Error",
        description: "Failed to validate XML. Please check for syntax errors.",
        variant: "destructive",
      })
      return false
    }
  }

  const renderNode = (node: XmlNode, index: number): JSX.Element => {
    if (node.type === "text") {
      return (
        <div
          key={`text-${index}`}
          className="text-green-600 dark:text-green-400 pl-6"
          style={{ marginLeft: `${node.depth * 20}px` }}
        >
          {node.text}
        </div>
      )
    }

    const hasChildren = node.children && node.children.length > 0
    const attributesString = node.attributes
      ? Object.entries(node.attributes)
          .map(([key, value]) => `${key}="${value}"`)
          .join(" ")
      : ""

    return (
      <div key={`element-${index}`}>
        <div className="flex items-start" style={{ marginLeft: `${node.depth * 20}px` }}>
          {hasChildren && (
            <button onClick={() => toggleCollapse(node)} className="mr-1 mt-1 focus:outline-none">
              {node.collapsed ? (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          )}
          {!hasChildren && <span className="w-4" />}

          <div>
            <span className="text-blue-600 dark:text-blue-400">{"<"}</span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">{node.name}</span>

            {node.attributes && Object.keys(node.attributes).length > 0 && (
              <span className="text-yellow-600 dark:text-yellow-400"> {attributesString}</span>
            )}

            {!hasChildren ? (
              <span className="text-blue-600 dark:text-blue-400">{" />"}</span>
            ) : (
              <span className="text-blue-600 dark:text-blue-400">{">"}</span>
            )}
          </div>
        </div>

        {hasChildren && !node.collapsed && (
          <div>{node.children!.map((child, childIndex) => renderNode(child, childIndex))}</div>
        )}

        {hasChildren && (
          <div className={cn(node.collapsed ? "hidden" : "block")} style={{ marginLeft: `${node.depth * 20}px` }}>
            <span className="text-blue-600 dark:text-blue-400">{"</"}</span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">{node.name}</span>
            <span className="text-blue-600 dark:text-blue-400">{">"}</span>
          </div>
        )}
      </div>
    )
  }

  const renderLineNumbers = () => {
    if (!editedXml) return null

    const lines = editedXml.split("\n").length
    return (
      <div className="line-numbers select-none text-right pr-2 text-muted-foreground border-r border-border">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-6 text-xs">
            {i + 1}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute right-2 top-2 flex gap-2 z-10">
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!initialXml || !!error}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </>
            )}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-[200px] grid-cols-2">
          <TabsTrigger value="view">View</TabsTrigger>
          {!readOnly && <TabsTrigger value="edit">Edit</TabsTrigger>}
        </TabsList>

        <TabsContent value="view" className="mt-2">
          <div className="rounded-md border bg-muted/50 p-4 overflow-x-auto font-mono text-sm">
            {error ? (
              <div className="text-destructive p-4 text-center">{error}</div>
            ) : !parsedXml ? (
              <div className="text-muted-foreground p-4 text-center">Loading XML...</div>
            ) : (
              <div className="whitespace-pre">{renderNode(parsedXml, 0)}</div>
            )}
          </div>
        </TabsContent>

        {!readOnly && (
          <TabsContent value="edit" className="mt-2">
            {validationError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={formatXml}>
                <Code className="h-4 w-4 mr-1" />
                Format XML
              </Button>
              <Button variant="outline" size="sm" onClick={validateXml}>
                <Check className="h-4 w-4 mr-1" />
                Validate
              </Button>
              <Button variant="default" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
            </div>

            <div className="rounded-md border bg-muted/50 overflow-hidden">
              <div className="flex">
                {renderLineNumbers()}
                <Textarea
                  ref={textareaRef}
                  value={editedXml}
                  onChange={(e) => setEditedXml(e.target.value)}
                  className="font-mono text-sm min-h-[300px] resize-y border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ lineHeight: "1.5rem" }}
                  spellCheck={false}
                />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
