#include <iostream>
#include <algorithm>
#include <utility>
#include <vector>
using namespace std;

vector<pair<int, int>> merge(vector<pair<int, int>> intervals) {
    sort(intervals.begin(), intervals.end());       // by start time
    vector<pair<int, int>> merged;
    for (auto cur : intervals) {
        if (merged.empty() || cur.first > merged.back().second) {
            merged.push_back(cur);                  // no overlap: new interval
        } else {
            merged.back().second = max(merged.back().second, cur.second);  // overlap: extend
        }
    }
    return merged;
}

int main() {
    vector<pair<int, int>> intervals = {{1, 3}, {8, 10}, {2, 6}, {15, 18}, {9, 12}};

    vector<pair<int, int>> result = merge(intervals);
    cout << "Merged: ";
    for (auto p : result) {
        cout << "[" << p.first << ", " << p.second << "] ";
    }
    cout << endl;
    return 0;
}
