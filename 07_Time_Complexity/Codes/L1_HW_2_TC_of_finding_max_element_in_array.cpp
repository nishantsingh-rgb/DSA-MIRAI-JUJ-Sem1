#include <iostream>
using namespace std;

int main() {
    int arr[7] = {12, 45, 7, 89, 23, 56, 34};
    int n = 7;
    int maxVal = arr[0];
    int comparisons = 0;

    for (int i = 1; i < n; i++) {
        comparisons++;
        if (arr[i] > maxVal) {
            maxVal = arr[i];
        }
    }

    cout << "Maximum element: " << maxVal << endl;
    cout << "Comparisons made: " << comparisons << " (N - 1)" << endl;
    cout << "Every element must be checked, so TC = Theta(N)" << endl;
    return 0;
}
