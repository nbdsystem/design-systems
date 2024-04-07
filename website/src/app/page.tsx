'use client';

import { designSystems } from '@nbds/design-systems';
import Link from 'next/link';
import { useState } from 'react';

export default function IndexPage() {
  const [query, setQuery] = useState('');
  const results =
    query !== ''
      ? designSystems.filter((designSystem) => {
          return designSystem.name.toLowerCase().includes(query);
        })
      : designSystems;
  return (
    <>
      <main className="p-4 flex flex-col gap-y-4">
        <h1 className="text-2xl font-bold">
          Design systems ({results.length})
        </h1>
        <div>
          <form>
            <div className="flex flex-col">
              <label htmlFor="search-input">Find a design system</label>
              <input
                aria-describedby="search-input-desc"
                className="border border-black"
                id="search-input"
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value.toLowerCase());
                }}
              />
              <p id="search-input-desc">
                Design systems will be filtered as you type
              </p>
            </div>
          </form>
        </div>
        <h2 className="text-xl font-semibold">
          Results
          <div className="text-sm font-normal">
            {results.length === 0
              ? 'No results found'
              : `${results.length} results found`}
          </div>
        </h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Sponsor</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const key = `${result.sponsor}:${result.name}`;
              const website = result.links.find((link) => {
                return link.type === 'website';
              });

              return (
                <tr key={key}>
                  <td>
                    {website ? (
                      <Link
                        className="text-blue-600 underline"
                        href={website.url}
                        rel="noopener noreferrer"
                        target="_blank">
                        {result.name}
                      </Link>
                    ) : (
                      result.name
                    )}
                  </td>
                  <td>{result.sponsor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>
    </>
  );
}
