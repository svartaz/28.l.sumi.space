open System
open System.Collections.Generic
open System.Diagnostics
open System.IO
open System.Text.RegularExpressions

let consonants =
    [ 'g' // [ŋ]
      'n'
      'm'
      'c' // [g]
      'd'
      'b'
      'k'
      't'
      'p'
      'x'
      'l' // [ɕ]
      's'
      'f'
      'h' // [ɣ]
      'j' // [ʑ]
      'z'
      'v'
      'r' ]

let vowels = [ 'i'; 'y'; 'w'; 'u'; 'e'; 'q'; 'o'; 'a' ]

let graph =
    let trails =
        [ // velar
          [ 'g'; 'c'; 'k'; 'x'; 'h'; 'c' ]
          // palatal
          [ 'N'; 'D'; 'T'; 'l'; 'j'; 'D' ]
          [ 'J'; 'j'; 'r' ]
          // dental
          [ 'n'; 'd'; 't'; 's'; 'z'; 'd' ]
          [ 'n'; 'r'; 'd' ]
          // labial
          [ 'm'; 'b'; 'p'; 'f'; 'v'; 'b' ]
          [ 'v'; 'W' ]
          //nasal
          [ 'g'; 'N'; 'n'; 'm' ]
          // voiced plosive
          [ 'c'; 'D'; 'd'; 'b' ]
          // unvoiced plosive
          [ 'k'; 'T'; 't'; 'p' ]
          // unvoiced fricative
          [ 'x'; 'l'; 's'; 'f' ]
          // voiced fricative
          [ 'h'; 'j'; 'z'; 'v' ]
          // vowel
          [ 'J'; 'i'; 'e'; 'a'; 'o'; 'u'; 'W' ]
          // front round
          [ 'y'; 'q' ]
          // center
          [ 'a'; 'w' ]
          // high
          [ 'i'; 'y' ]
          // mid
          [ 'e'; 'q' ] ]

    let nodes = trails |> List.collect id |> Set.ofList

    let undirectedEdges =
        trails
        |> List.collect (fun trail ->
            trail
            |> List.pairwise
            |> List.collect (fun (left, right) -> [ left, right; right, left ]))

    nodes
    |> Seq.map (fun node ->
        let neighbors =
            undirectedEdges
            |> List.choose (fun (left, right) -> if left = node then Some right else None)
            |> Set.ofList

        node, neighbors)
    |> Map.ofSeq

let realLetters = graph.Keys |> Seq.filter (Char.IsUpper >> not) |> Set.ofSeq

let shortestPathLengthsFrom start =
    let distances = Dictionary<char, int>()
    let queue = Queue<char>()
    distances[start] <- 0
    queue.Enqueue start

    while queue.Count > 0 do
        let current = queue.Dequeue()
        let nextDistance = distances[current] + 1

        for neighbor in graph[current] do
            if not (distances.ContainsKey neighbor) then
                distances[neighbor] <- nextDistance
                queue.Enqueue neighbor

    distances |> Seq.map (fun pair -> pair.Key, pair.Value) |> Map.ofSeq

let letterDistances =
    realLetters
    |> Seq.map (fun letter -> letter, shortestPathLengthsFrom letter)
    |> Map.ofSeq

let distance left right =
    if left = right then
        Some 0
    else
        Map.tryFind left letterDistances |> Option.bind (Map.tryFind right)

(*
  iwueao qy
g !      !!
cq
xh! !    !!
lj !！ ！
n
dt       !!
sz!      !!
m
bp
fv  !
r
*)

let isValidToken (token: string) =
    not (
        Regex.IsMatch(
            token,
            [ @"[lj][wuo]"
              @"[gxhsz]i"
              @"[fv]u"
              @"[gxhdtsz][qy]"
              // no intervocalic plosive
              @"[iywueqoa][cdbktp][iywueqoa]"
              // only continuant coda
              @"[^iywueqoanxlsfr]$"
              // no two iotated vowels
              @"[wyq].+[wyq]" ]
            |> String.concat "|"
        )
    )

let cv =
    [ for c in consonants do
          for v in vowels do
              let token = System.String [| c; v |]

              if isValidToken token then
                  yield token ]

let cvc =
    [ for c0 in consonants do
          for v in vowels do
              for c1 in consonants do
                  let token = System.String [| c0; v; c1 |]

                  if isValidToken token then
                      yield token ]

let cvcv =
    [ for c0 in consonants do
          for v0 in vowels do
              for c1 in consonants do
                  for v1 in vowels do
                      let token = System.String [| c0; v0; c1; v1 |]

                      if
                          isValidToken token
                          && (match distance v0 v1 with
                              | Some distance -> distance < 2
                              | None -> false)
                      then
                          yield token ]

let tokens = cv @ cvc @ cvcv

let pathDirResource = Path.Combine(__SOURCE_DIRECTORY__, "resource")
let pathDirIn = Path.Combine(__SOURCE_DIRECTORY__, "input")
let pathDirOut = Path.Combine(__SOURCE_DIRECTORY__, "output")

Directory.CreateDirectory(pathDirOut) |> ignore

let pathGismuToDefinition = Path.Combine(pathDirIn, "gismu_to_definition.tsv")
let pathLojbanTsv = Path.Combine(pathDirResource, "dictionary-en.tsv")
let pathTokens = Path.Combine(pathDirOut, "tokens.txt")
let pathFull = Path.Combine(pathDirOut, "full.tsv")
let pathDefined = Path.Combine(pathDirOut, "defined.tsv")

printfn "%d syllables" tokens.Length
File.WriteAllLines(pathTokens, tokens)

let normalizeWhitespace (text: string) = Regex.Replace(text.Trim(), @"\s+", " ")

let fieldOrEmpty index (fields: string array) =
    if index < fields.Length then fields[index].Trim() else ""

let isHeadwordSimple (text: string) = Regex.IsMatch(text, @"^[a-z'.]+$")

let tryParseRequiredSyllableLength (text: string) =
    match Int32.TryParse text with
    | true, value -> Some value
    | false, _ -> None

type InputDefinitionRow =
    { Word: string
      SyllableLength: int option
      Keyword: string
      Date: string
      WordClass: string
      Definition: string }

type GeneratedOverrideRow =
    { Keyword: string
      Date: string
      WordClass: string
      Definition: string
      FixedSyllable: string option
      RequiredSyllableLength: int option }

type CompoundOverrideRow =
    { Components: string list
      Keyword: string
      Date: string
      WordClass: string
      Definition: string
      RequiredSyllableLength: int option }

let isCommentOrBlankLine (line: string) =
    String.IsNullOrWhiteSpace line || line.StartsWith("#")

let isCompound (word: string) = word.Contains("+")

let tryParseInputDefinitionRow (line: string) =
    if isCommentOrBlankLine line then
        None
    else
        let fields = line.Split '\t'
        let word = fieldOrEmpty 0 fields
        let syllableLengthText = fieldOrEmpty 1 fields
        let keyword = fieldOrEmpty 2 fields
        let date = fieldOrEmpty 3 fields
        let wordClass = fieldOrEmpty 4 fields
        let definition = fieldOrEmpty 5 fields

        if word = "jbo or string" && syllableLengthText = "length" then
            None
        else
            Some
                { Word = word
                  SyllableLength = tryParseRequiredSyllableLength syllableLengthText
                  Keyword = keyword
                  Date = date
                  WordClass = wordClass
                  Definition = definition }

let inputDefinitionRows =
    File.ReadLines(pathGismuToDefinition)
    |> Seq.choose tryParseInputDefinitionRow
    |> Seq.toList

let overrideLexiconRows =
    inputDefinitionRows
    |> List.choose (fun row ->
        if
            String.IsNullOrWhiteSpace row.Word
            || row.Word.StartsWith("=")
            || isCompound row.Word
            || String.IsNullOrWhiteSpace row.Definition
        then
            None
        else
            Some(row.Word, row.Keyword, row.Definition))

let compoundOverrideRows =
    inputDefinitionRows
    |> List.choose (fun row ->
        if
            not (isCompound row.Word)
            || String.IsNullOrWhiteSpace row.Keyword
            || String.IsNullOrWhiteSpace row.Definition
        then
            None
        else
            Some
                { Components = row.Word.Split('+', StringSplitOptions.RemoveEmptyEntries) |> Array.toList
                  Keyword = row.Keyword
                  Date = row.Date
                  WordClass = row.WordClass
                  Definition = row.Definition
                  RequiredSyllableLength = row.SyllableLength })

let generatedOverrideRows =
    inputDefinitionRows
    |> List.choose (fun row ->
        if
            (not (String.IsNullOrWhiteSpace row.Word) && not (row.Word.StartsWith "="))
            || String.IsNullOrWhiteSpace row.Keyword
            || String.IsNullOrWhiteSpace row.Definition
        then
            None
        else
            let fixedSyllable =
                if row.Word.StartsWith("=") then
                    Some(row.Word.Substring(1))
                else
                    None

            Some
                { Keyword = row.Keyword
                  Date = row.Date
                  WordClass = row.WordClass
                  Definition = row.Definition
                  FixedSyllable = fixedSyllable
                  RequiredSyllableLength = row.SyllableLength })

let overrideWords =
    overrideLexiconRows |> List.map (fun (word, _, _) -> word) |> Set.ofList

let normalizeEntryType entryType =
    match entryType with
    | "experimental gismu" -> "gismu"
    | "experimental cmavo" -> "cmavo"
    | other -> other

type ParsedLexiconEntry =
    { Word: string
      EntryType: string
      RafsiForms: string list
      PrimaryKeyword: string
      SecondaryKeyword: string
      DefaultMeaning: string }

let parsedLexiconEntries =
    let lines = File.ReadAllLines pathLojbanTsv
    let header = lines[0].Split '\t'
    let headerIndex = header |> Array.mapi (fun i name -> name, i) |> Map.ofArray

    let fieldAt fieldName (fields: string array) =
        match Map.tryFind fieldName headerIndex with
        | Some index when index < fields.Length -> fields[index].Trim()
        | _ -> ""

    let dictionaryEntries =
        lines
        |> Seq.skip 1
        |> Seq.map (fun line ->
            let fields = line.Split '\t'
            let word = fieldAt "word" fields
            let entryType = fieldAt "type" fields |> normalizeWhitespace |> normalizeEntryType

            let rafsiForms =
                fieldAt "rafsi" fields
                |> normalizeWhitespace
                |> fun value -> value.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                |> Array.filter isHeadwordSimple
                |> Array.toList

            let definition = fieldAt "definition" fields |> normalizeWhitespace
            let primaryKeyword = fieldAt "glossword_1" fields |> normalizeWhitespace
            let secondaryKeyword = fieldAt "glossword_2" fields |> normalizeWhitespace

            { Word = word
              EntryType = entryType
              RafsiForms = rafsiForms
              PrimaryKeyword = primaryKeyword
              SecondaryKeyword = secondaryKeyword
              DefaultMeaning = definition })
        |> Seq.filter (fun entry ->
            isHeadwordSimple entry.Word
            && (entry.EntryType = "gismu"
                || (entry.EntryType = "cmavo" && Set.contains entry.Word overrideWords))
            && not (String.IsNullOrWhiteSpace entry.DefaultMeaning))
        |> Seq.toList

    let dictionaryWords = dictionaryEntries |> List.map _.Word |> Set.ofList

    let fallbackEntries =
        overrideLexiconRows
        |> List.choose (fun (word, keyword, definition) ->
            if Set.contains word dictionaryWords || not (isHeadwordSimple word) then
                None
            else
                Some
                    { Word = word
                      EntryType = "override"
                      RafsiForms = []
                      PrimaryKeyword = keyword
                      SecondaryKeyword = ""
                      DefaultMeaning = normalizeWhitespace definition })

    dictionaryEntries @ fallbackEntries
    |> List.distinctBy _.Word
    |> List.sortBy (fun entry -> entry.PrimaryKeyword, entry.SecondaryKeyword, entry.DefaultMeaning)

printfn
    "%d gismu"
    (parsedLexiconEntries
     |> List.filter (fun entry -> entry.EntryType = "gismu")
     |> List.length)

printfn
    "%d cmavo"
    (parsedLexiconEntries
     |> List.filter (fun entry -> entry.EntryType = "cmavo")
     |> List.length)

printfn "%d randoms" generatedOverrideRows.Length
printfn "%d compounds" compoundOverrideRows.Length

let syllableArray = List.toArray tokens
let syllablePriorityArray: float array = Array.zeroCreate syllableArray.Length
let cvSyllableIndices = Array.init cv.Length id
let shortSyllableIndices = Array.init (cv.Length + cvc.Length) id
let syllableFirstVowelArray = Array.zeroCreate<char option> syllableArray.Length

let cvcvSyllableIndices =
    Array.init cvcv.Length (fun index -> cv.Length + cvc.Length + index)

let syllableIndexByToken =
    syllableArray
    |> Array.mapi (fun index syllable -> syllable, index)
    |> Map.ofArray

let isVowel c = Set.contains c (set "iywueqoa")

let tryFindFirstVowel (text: string) = text |> Seq.tryFind isVowel

do
    syllableArray
    |> Array.iteri (fun index syllable -> syllableFirstVowelArray[index] <- tryFindFirstVowel syllable)

let normalizeGismu =
    String.collect (function
        | '\'' -> "h"
        | '.' -> ""
        | 'c' -> "l"
        | 'g' -> "c"
        | 'j' -> "j"
        | 'l' -> "r"
        | c -> string c)

let scoreCandidate =
    let vowelPattern = "iywueqoa"
    let consonantPattern = $"[^{vowelPattern}]"
    let vowelClass = $"[{vowelPattern}]"

    let ccvcv =
        Regex($"^{consonantPattern}{{2}}{vowelClass}{consonantPattern}{vowelClass}$")

    let cvccv =
        Regex($"^{consonantPattern}{vowelClass}{consonantPattern}{{2}}{vowelClass}$")

    let substitutionCost left right =
        match distance left right with
        | Some distance -> float distance
        | None -> failwithf "letters '%c' and '%c' are disconnected in trails" left right

    let nearestNeighborDistance =
        realLetters
        |> Seq.map (fun token ->
            let nearest =
                realLetters
                |> Seq.filter ((<>) token)
                |> Seq.map (substitutionCost token)
                |> Seq.min

            token, nearest)
        |> Map.ofSeq

    let insertionCost token =
        nearestNeighborDistance[token] + if isVowel token then 0.4 else 0.25

    let weightedDistance (source: string) (target: string) =
        let cols = target.Length + 1
        let previous = Array.zeroCreate<float> cols
        let current = Array.zeroCreate<float> cols

        for col in 1 .. target.Length do
            previous[col] <- previous[col - 1] + insertionCost target.[col - 1]

        for row in 1 .. source.Length do
            current[0] <- previous[0] + insertionCost source.[row - 1]

            for col in 1 .. target.Length do
                let delete = previous[col] + insertionCost source.[row - 1]
                let insert = current[col - 1] + insertionCost target.[col - 1]

                let substitute =
                    previous[col - 1] + substitutionCost source.[row - 1] target.[col - 1]

                current[col] <- min delete (min insert substitute)

            Array.blit current 0 previous 0 cols

        previous[target.Length]

    let buildProjectShapes (normalized: string) =
        let chars = normalized.ToCharArray()

        [ normalized
          if ccvcv.IsMatch normalized then
              String.Concat(chars.[0], chars.[1], chars.[2], chars.[3])
              String.Concat(chars.[0], chars.[1], chars.[2])
          elif cvccv.IsMatch normalized then
              String.Concat(chars.[0], chars.[1], chars.[2])
              String.Concat(chars.[0], chars.[1], chars.[3])
              String.Concat(chars.[0], chars.[1], chars.[2], chars.[3]) ]
        |> List.distinct
        |> List.toArray

    fun (normalized: string) ->
        let projectShapes = buildProjectShapes normalized
        let firstVowel = tryFindFirstVowel normalized
        let firstCharacter = normalized[0]
        let firstCharacterBonus = nearestNeighborDistance[firstCharacter] * 0.75

        let firstVowelBonus =
            firstVowel |> Option.map (fun vowel -> nearestNeighborDistance[vowel] * 0.5)

        let normalizedLength = normalized.Length

        fun (candidateIndex: int) ->
            let candidate = syllableArray[candidateIndex]

            let bonus =
                let mutable total = 0.0

                if firstCharacter = candidate[0] then
                    total <- total + firstCharacterBonus

                match firstVowelBonus, syllableFirstVowelArray[candidateIndex] with
                | Some vowelBonus, Some leftVowel when Some leftVowel = firstVowel -> total <- total + vowelBonus
                | _ -> ()

                total

            let mutable best = Double.PositiveInfinity

            for projection in projectShapes do
                let score = weightedDistance projection candidate - bonus

                if score < best then
                    best <- score

            best, abs (normalizedLength - candidate.Length)

[<Struct>]
type ReferenceProfile = { ScoreCandidate: int -> float * int }

type DefinitionOverride =
    { Keyword: string
      Date: string
      WordClass: string
      RequiredSyllableLength: int option
      Definition: string }

type HeadwordEntry =
    { Id: string
      Word: string
      EntryType: string
      WordClass: string
      RequiredSyllableLength: int option
      FixedSyllable: string option
      Rafsi: string list
      EnglishKeyword: string
      Meaning: string
      LojbanMeaning: string
      ReferenceForms: string list
      DefinitionOverride: DefinitionOverride option }

type CompoundAssignment =
    { Token: string
      Keyword: string
      Date: string
      WordClass: string
      Definition: string
      LojbanMeaning: string }

let definitionOverrides =
    inputDefinitionRows
    |> Seq.choose (fun row ->
        if
            String.IsNullOrWhiteSpace row.Word
            || row.Word.StartsWith("=")
            || isCompound row.Word
            || String.IsNullOrWhiteSpace row.Definition
        then
            None
        else
            Some(
                row.Word,
                { Keyword = row.Keyword
                  Date = row.Date
                  WordClass = row.WordClass
                  RequiredSyllableLength = row.SyllableLength
                  Definition = row.Definition }
            ))
    |> Map.ofSeq

let syllableLengthOfToken (token: string) = token.Length

let syllableLengthArray = syllableArray |> Array.map syllableLengthOfToken

let filterCandidateIndicesByRequiredLength requiredLength candidateIndices =
    candidateIndices
    |> Array.filter (fun index -> syllableLengthArray[index] = requiredLength)

let usesCvOnlySyllables (entry: HeadwordEntry) =
    entry.WordClass = "preposition" || entry.WordClass = "preverb"

let constrainCandidateIndices (entry: HeadwordEntry) candidateIndices =
    match entry.RequiredSyllableLength with
    | Some requiredLength -> filterCandidateIndicesByRequiredLength requiredLength candidateIndices
    | None -> candidateIndices

let usesShortSyllables (entry: HeadwordEntry) =
    entry.EntryType = "generated" && entry.WordClass <> "verb"
    || entry.EntryType = "cmavo"
    || entry.EntryType = "experimental cmavo"

let defaultCandidateIndicesFor (entry: HeadwordEntry) =
    if usesCvOnlySyllables entry then cvSyllableIndices
    elif usesShortSyllables entry then shortSyllableIndices
    else cvcvSyllableIndices

let candidateIndicesFor (entry: HeadwordEntry) =
    match entry.FixedSyllable with
    | Some fixedSyllable ->
        match Map.tryFind fixedSyllable syllableIndexByToken with
        | Some index -> [| index |]
        | None -> [||]
    | None -> constrainCandidateIndices entry (defaultCandidateIndicesFor entry)

let referenceFormsFor (entryType: string) (word: string) (rafsiForms: string list) =
    if entryType = "gismu" && word.Length = 5 then [ word ]
    elif List.isEmpty rafsiForms then [ word ]
    else rafsiForms

let dictionaryHeadwordEntries =
    parsedLexiconEntries
    |> List.map (fun entry ->
        let definitionOverride = Map.tryFind entry.Word definitionOverrides

        let wordClass =
            definitionOverride |> Option.map _.WordClass |> Option.defaultValue ""

        let requiredSyllableLength =
            definitionOverride |> Option.bind _.RequiredSyllableLength

        let meaning =
            definitionOverride
            |> Option.map _.Definition
            |> Option.defaultValue entry.DefaultMeaning

        let lojbanMeaning =
            if entry.EntryType = "override" then
                ""
            else
                entry.DefaultMeaning

        let referenceForms = referenceFormsFor entry.EntryType entry.Word entry.RafsiForms

        { Id = entry.Word
          Word = entry.Word
          EntryType = entry.EntryType
          WordClass = wordClass
          RequiredSyllableLength = requiredSyllableLength
          FixedSyllable = None
          Rafsi = entry.RafsiForms
          EnglishKeyword =
            [ entry.PrimaryKeyword; entry.SecondaryKeyword ]
            |> List.filter (String.IsNullOrWhiteSpace >> not)
            |> String.concat " "
          Meaning = meaning
          LojbanMeaning = lojbanMeaning
          ReferenceForms = referenceForms
          DefinitionOverride = definitionOverride })

let generatedHeadwordEntries =
    generatedOverrideRows
    |> List.mapi (fun index row ->
        { Id = $"_generated_{index}_{row.Keyword}"
          Word = ""
          EntryType = "generated"
          WordClass = row.WordClass
          RequiredSyllableLength = row.RequiredSyllableLength
          FixedSyllable = row.FixedSyllable
          Rafsi = []
          EnglishKeyword = row.Keyword
          Meaning = row.Definition
          LojbanMeaning = ""
          ReferenceForms = []
          DefinitionOverride =
            Some
                { Keyword = row.Keyword
                  Date = row.Date
                  WordClass = row.WordClass
                  RequiredSyllableLength = row.RequiredSyllableLength
                  Definition = row.Definition } })

let headwordEntries = dictionaryHeadwordEntries @ generatedHeadwordEntries

do
    headwordEntries
    |> List.choose (fun entry ->
        entry.FixedSyllable
        |> Option.bind (fun fixedSyllable ->
            if Map.containsKey fixedSyllable syllableIndexByToken then
                None
            else
                Some(entry.EnglishKeyword, fixedSyllable)))
    |> List.iter (fun (keyword, fixedSyllable) ->
        printfn "warning: fixed syllable '%s' for '%s' is not in token inventory" fixedSyllable keyword)

let assignmentSeed = 20579
let assignmentRandom = Random(assignmentSeed)

let shuffledPriorities items =
    items
    |> List.map (fun item -> item, assignmentRandom.NextDouble())
    |> Map.ofList

let headwordPriority = headwordEntries |> List.map _.Id |> shuffledPriorities

let syllablePriority = shuffledPriorities tokens

do
    syllableArray
    |> Array.iteri (fun index syllable -> syllablePriorityArray[index] <- syllablePriority[syllable])

[<Struct>]
type ScoredCandidate =
    { Index: int
      Score: float
      LengthPenalty: int }

type PreparedEntry =
    { Entry: HeadwordEntry
      Candidates: ScoredCandidate array
      PriorityGap: float }

let isBetterCandidate left right =
    left.Score < right.Score
    || (left.Score = right.Score
        && (left.LengthPenalty < right.LengthPenalty
            || (left.LengthPenalty = right.LengthPenalty
                && syllablePriorityArray[left.Index] < syllablePriorityArray[right.Index])))

let prepareEntry entry =
    let referenceProfiles =
        entry.ReferenceForms
        |> List.map normalizeGismu
        |> List.distinct
        |> List.map (fun normalized -> { ScoreCandidate = scoreCandidate normalized })
        |> List.toArray

    let candidateIndices = candidateIndicesFor entry
    let candidates = Array.zeroCreate<ScoredCandidate> candidateIndices.Length

    let mutable best = Unchecked.defaultof<ScoredCandidate>
    let mutable second = Unchecked.defaultof<ScoredCandidate>
    let mutable foundBest = false
    let mutable foundSecond = false

    for candidatePosition in 0 .. candidateIndices.Length - 1 do
        let index = candidateIndices[candidatePosition]
        let mutable candidateScore = 0.0
        let mutable candidateLengthPenalty = 0

        if referenceProfiles.Length > 0 then
            candidateScore <- Double.PositiveInfinity
            candidateLengthPenalty <- Int32.MaxValue

            for referenceProfile in referenceProfiles do
                let score, lengthPenalty = referenceProfile.ScoreCandidate index

                if
                    score < candidateScore
                    || (score = candidateScore && lengthPenalty < candidateLengthPenalty)
                then
                    candidateScore <- score
                    candidateLengthPenalty <- lengthPenalty

        let candidate =
            { Index = index
              Score = candidateScore
              LengthPenalty = candidateLengthPenalty }

        candidates[candidatePosition] <- candidate

        if not foundBest || isBetterCandidate candidate best then
            if foundBest then
                second <- best
                foundSecond <- true

            best <- candidate
            foundBest <- true
        elif not foundSecond || isBetterCandidate candidate second then
            second <- candidate
            foundSecond <- true

    let priorityGap =
        if foundSecond then
            second.Score - best.Score
        else
            Double.PositiveInfinity

    { Entry = entry
      Candidates = candidates
      PriorityGap = priorityGap }

let scoringStopwatch = Stopwatch.StartNew()

let preparedEntries =
    headwordEntries
    |> List.toArray
    |> Array.Parallel.map prepareEntry
    |> Array.toList

scoringStopwatch.Stop()
printfn "scored in %d ms" scoringStopwatch.ElapsedMilliseconds

let tryPickBestAvailable (availableSyllables: bool array) (candidates: ScoredCandidate array) =
    let mutable best = Unchecked.defaultof<ScoredCandidate>
    let mutable found = false

    for candidate in candidates do
        if
            availableSyllables[candidate.Index]
            && (not found || isBetterCandidate candidate best)
        then
            best <- candidate
            found <- true

    if found then Some best else None

let assignmentStopwatch = Stopwatch.StartNew()

let assignments =
    let availableSyllables = Array.create syllableArray.Length true

    preparedEntries
    |> List.sortBy (fun preparedEntry ->
        let typePriority =
            if preparedEntry.Entry.FixedSyllable.IsSome then -1
            elif preparedEntry.Entry.EntryType = "generated" then 2
            elif preparedEntry.Entry.EntryType = "cmavo" then 1
            else 0

        typePriority, preparedEntry.PriorityGap, headwordPriority[preparedEntry.Entry.Id])
    |> List.choose (fun preparedEntry ->
        match tryPickBestAvailable availableSyllables preparedEntry.Candidates with
        | Some best ->
            availableSyllables[best.Index] <- false
            Some(preparedEntry.Entry, syllableArray[best.Index])
        | None -> None)

assignmentStopwatch.Stop()
printfn "assigned in %d ms" assignmentStopwatch.ElapsedMilliseconds

printfn "%d headwords" headwordEntries.Length

let assignmentsBySyllable =
    assignments |> List.map (fun (entry, syllable) -> syllable, entry) |> Map.ofList

let compoundAssignments =
    let baseAssignmentsByKeyword =
        assignments
        |> List.choose (fun (entry, syllable) ->
            entry.DefinitionOverride
            |> Option.map (fun definitionOverride -> definitionOverride.Keyword, (syllable, entry)))
        |> Map.ofList

    let rec resolve resolved pending =
        let resolvedNow, pendingNow, progress =
            ((resolved, [], false), pending)
            ||> List.fold (fun (resolvedAcc, pendingAcc, progressAcc) row ->
                let componentTokens =
                    row.Components
                    |> List.map (fun componentKey ->
                        Map.tryFind componentKey resolvedAcc
                        |> Option.map _.Token
                        |> Option.orElseWith (fun () ->
                            Map.tryFind componentKey baseAssignmentsByKeyword |> Option.map fst))

                if List.forall Option.isSome componentTokens then
                    let token = componentTokens |> List.choose id |> String.concat ""

                    let lojbanMeaning =
                        row.Components
                        |> List.choose (fun componentKey ->
                            Map.tryFind componentKey resolvedAcc
                            |> Option.map _.LojbanMeaning
                            |> Option.orElseWith (fun () ->
                                Map.tryFind componentKey baseAssignmentsByKeyword
                                |> Option.map (fun (_, entry) -> entry.LojbanMeaning))
                            |> Option.filter (String.IsNullOrWhiteSpace >> not))
                        |> String.concat " + "

                    let assignment =
                        { Token = token
                          Keyword = row.Keyword
                          Date = row.Date
                          WordClass = row.WordClass
                          Definition = row.Definition
                          LojbanMeaning = lojbanMeaning }

                    Map.add row.Keyword assignment resolvedAcc, pendingAcc, true
                else
                    resolvedAcc, row :: pendingAcc, progressAcc)

        if progress then
            resolve resolvedNow (List.rev pendingNow)
        else
            resolvedNow, List.rev pendingNow

    let resolved, unresolved = resolve Map.empty compoundOverrideRows

    unresolved
    |> List.iter (fun row ->
        printfn "warning: compound '%s' for '%s' could not be resolved" (String.concat "+" row.Components) row.Keyword)

    resolved |> Map.values |> Seq.toList

File.WriteAllLines(
    Path.Combine(pathDirOut, "full.tsv"),
    [ "token\tjbo\trafsi\ten\tdescription\tjbo description" ]
    @ (tokens
       |> List.map (fun token ->
           match Map.tryFind token assignmentsBySyllable with
           | Some entry ->
               let rafsiText = String.concat " " entry.Rafsi

               let description =
                   entry.DefinitionOverride |> Option.map _.Definition |> Option.defaultValue ""

               let outputWord =
                   if String.IsNullOrWhiteSpace entry.Word then
                       ""
                   else
                       entry.Word

               $"{token}\t{outputWord}\t{rafsiText}\t{entry.EnglishKeyword}\t{description}\t{entry.LojbanMeaning}"
           | None -> $"{token}\t\t\t\t\t"))
    @ (compoundAssignments
       |> List.map (fun assignment ->
           $"{assignment.Token}\t\t\t{assignment.Keyword}\t{assignment.Definition}\t{assignment.LojbanMeaning}"))
)

File.WriteAllLines(
    pathDefined,
    [ "token\tjbo\ten\tdate\tclass\tdescription\tjbo description" ]
    @ (tokens
       |> List.choose (fun token ->
           match Map.tryFind token assignmentsBySyllable with
           | Some entry ->
               entry.DefinitionOverride
               |> Option.map (fun definitionOverride ->
                   $"{token}\t{entry.Word}\t{definitionOverride.Keyword}\t{definitionOverride.Date}\t{definitionOverride.WordClass}\t{definitionOverride.Definition}\t{entry.LojbanMeaning}")
           | None -> None))
    @ (compoundAssignments
       |> List.map (fun assignment ->
           $"{assignment.Token}\t\t{assignment.Keyword}\t{assignment.Date}\t{assignment.WordClass}\t{assignment.Definition}\t{assignment.LojbanMeaning}"))
)
